from pathlib import Path
from uuid import uuid4
from .models import StoredFile
from django.utils import timezone

from rest_framework.exceptions import PermissionDenied, NotFound


def upload_file(*, owner, uploaded_file, comment=""):
    """
    Сохраняет загруженный пользователем файл на диск и создаёт запись в БД.
    """

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

    return stored_file


# функция получения файлов
def get_user_files(owner):
    """
    Возвращает все файлы пользователя.
    """
    return owner.files.all()


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

    stored_file.file.delete(save=False)  # удаляем файл с диска, не трогая запись в БД
    stored_file.delete()  # удаляем запись из БД


def update_user_file(owner, file_id, data: dict):
    # Получаем объект (файл)
    stored_file = get_user_file(owner, file_id)

    # Метод setattr(объект, имя_поля (ключ), значение)
    for field, value in data.items():
        setattr(stored_file, field, value)

    stored_file.save()

    return stored_file


def get_file_for_download(owner, file_id):
    # Получаем объект (файл)
    stored_file = get_user_file(owner, file_id)

    # Обновляем время последнего скачивания
    stored_file.last_downloaded_at = timezone.now()

    # Используем update_fields - обновляем только одну колонку для производительности
    stored_file.save(update_fields=["last_downloaded_at"])

    return stored_file
