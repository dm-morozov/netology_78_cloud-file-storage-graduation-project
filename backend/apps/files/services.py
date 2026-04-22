import logging
from secrets import token_urlsafe
from pathlib import Path
from uuid import uuid4

from .models import StoredFile
from django.utils import timezone
from django.contrib.auth import get_user_model

from rest_framework.exceptions import PermissionDenied, NotFound

logger = logging.getLogger(__name__)  # Получаем логгер для текущего модуля

User = get_user_model()


def upload_file(*, owner, uploaded_file, comment=""):
    """
    Сохраняет загруженный пользователем файл на диск и создаёт запись в БД.
    """

    logger.info(
        "Начата загрузка файла. user_id=%s user_name=%s original_file_name=%s",
        owner.id,
        owner.username,
        uploaded_file.name,
    )

    original_name = uploaded_file.name
    suffix = Path(original_name).suffix
    stored_name = f"{uuid4()}{suffix}"

    stored_file = StoredFile(
        owner=owner,
        original_name=original_name,
        stored_name=stored_name,
        size=uploaded_file.size,
        comment=comment,
    )

    stored_file.file.save(
        stored_name, uploaded_file, save=False
    )  # file.save(имя_которое_хочешь, файл)
    # Улетает в FileField Нашей модели, где потом мы вызываем функцию
    stored_file.save()

    logger.info(
        "Файл успешно загружен. user_id=%s user_name=%s file_id=%s stored_name=%s",
        owner.id,
        owner.username,
        stored_file.id,
        stored_name,
    )

    return stored_file


# ПОЛУЧЕНИЕ ФАЙЛОВ ПОЛЬЗОВАТЕЛЯ
def get_files_for_listing(user, owner_id=None):
    if owner_id is None or user.id == owner_id:
        # Возвращает все файлы пользователя.
        return user.files.all()
    if not user.is_staff:
        raise PermissionDenied("У вас нет прав для просмотра чужого хранилища.")
    if owner_id and user.is_staff:
        try:
            target_user = User.objects.get(id=owner_id)
        except User.DoesNotExist:
            raise NotFound("Пользователь не найден.")

    return target_user.files.all()


def get_user_file(user, file_id):
    try:
        file = StoredFile.objects.get(id=file_id)
        # Проверка прав: владелец или админ
        if file.owner != user and not user.is_staff:
            raise PermissionDenied("У вас нет прав для доступа к этому файлу.")
        return file
    except StoredFile.DoesNotExist:
        raise NotFound("Файл не найден.")


def delete_user_file(owner, file_id):
    """
    Удаляет файл пользователя с диска и из базы данных.
    """
    stored_file = get_user_file(owner, file_id)

    logger.info(
        "Начато удаление файла. actor_id=%s file_id=%s owner_id=%s",
        owner.id,
        stored_file.id,
        stored_file.owner_id,
    )

    stored_file.file.delete(save=False)  # удаляем файл с диска, не трогая запись в БД
    stored_file.delete()  # удаляем запись из БД

    logger.info(
        "Файл успешно удалён. actor_id=%s file_id=%s",
        owner.id,
        file_id,
    )


def update_user_file(owner, file_id, data: dict):
    # Получаем объект (файл)
    stored_file = get_user_file(owner, file_id)

    # Метод setattr(объект, имя_поля (ключ), значение)
    for field, value in data.items():
        setattr(stored_file, field, value)

    stored_file.save()

    return stored_file


# Можно ли скачать файл
def get_downloadable_file(owner, file_id) -> StoredFile:
    """
    Возвращает файл, доступный для скачивания.
    """
    # Получаем объект (файл)
    stored_file = get_user_file(owner, file_id)

    # проверяем есть ли значение в поле FileField в БД
    # Эта проверка не проверяет файл на диске
    if not stored_file.file or not stored_file.file.name:
        raise NotFound("Файл не найден на сервере. Файл не привязан к записи в БД.")

    # Физически проверяем существует ли файл в хранилище
    if not stored_file.file.storage.exists(stored_file.file.name):
        raise NotFound("Файл не найден на сервере. Файл отсутствует на диске.")

    return stored_file


# зафиксировать время скачивания, если скачивание произошло
def mark_file_as_downloaded(stored_file) -> None:
    """
    Обновляет дату последнего скачивания файла.
    """
    # Обновляем время последнего скачивания
    stored_file.last_downloaded_at = timezone.now()

    # Используем update_fields - обновляем только одну колонку для производительности
    stored_file.save(update_fields=["last_downloaded_at"])

    logger.info(
        "Обновлено время скачивания файла. file_id=%s owner_id=%s last_downloaded_at=%s",
        stored_file.id,
        stored_file.owner_id,
        stored_file.last_downloaded_at,
    )


def generate_unique_token() -> str:
    """
    Генерирует уникальный public_token.
    """
    while True:
        token = token_urlsafe(24)
        if not StoredFile.objects.filter(public_token=token).exists():
            return token


def get_or_create_public_token(user, file_id) -> StoredFile:
    """
    Возвращает public_token для файла.
    """
    stored_file = get_user_file(user=user, file_id=file_id)
    if not stored_file.public_token:
        stored_file.public_token = generate_unique_token()
        stored_file.save(update_fields=["public_token"])

        logger.info(
            "Создан новый public_token. actor_id=%s actor_username=%s file_id=%s",
            user.id,
            user.username,
            stored_file.id,
        )
    else:
        logger.info(
            "Возвращён существующий public_token. actor_id=%s actor_username=%s file_id=%s",
            user.id,
            user.username,
            stored_file.id,
        )

    return stored_file


def get_public_downloadable_file(token) -> StoredFile:
    try:
        if not token:
            raise NotFound("Токен не предоставлен.")

        stored_file = StoredFile.objects.get(public_token=token)
    except StoredFile.DoesNotExist:
        raise NotFound("Файл по данной ссылке не найден.")

    # Проверяем физическое наличие файла
    # У FileField есть встроенный bool(file), который проверяет наличие имени
    if not stored_file.file:
        raise NotFound("Файл не найден на сервере. Файл не привязан к записи в БД.")

    # и метод storage.exists() для проверки диска
    if not stored_file.file.storage.exists(stored_file.file.name):
        raise NotFound("Файл не найден на сервере. Файл отсутствует на диске.")

    return stored_file
