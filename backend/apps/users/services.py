import logging

from django.contrib.auth import login, authenticate, logout
from django.db.models import Count, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework.exceptions import NotFound, PermissionDenied

from .models import User

logger = logging.getLogger(__name__)


def register_user(validated_data) -> User:
    """
    Регистрация нового пользователя

    :param validated_data: Сериализованные данные из формы регистрации
    :type validated_data: dict

    :return: Новый пользователь
    :rtype: User
    """

    logger.info(
        "Начата регистрация пользователя. username=%s email=%s",
        validated_data.get("username"),
        validated_data.get("email"),
    )

    # Используем именно create_user:
    # пароль хешируется, используется встроенная логика Django
    user = User.objects.create_user(**validated_data)

    logger.info(
        "Пользователь успешно зарегистрирован. user_id=%s username=%s email=%s",
        user.id,
        user.username,
        user.email,
    )

    return user


def login_user(request, username, password) -> User | None:

    user = authenticate(
        request=request,
        username=username,
        password=password,
    )

    if user is None:
        logger.warning(
            "Неуспешная попытка входа. username=%s",
            username,
        )
        return None

    login(request, user)

    logger.info(
        "Пользователь успешно вошёл в систему. user_id=%s username=%s",
        user.id,
        user.username,
    )

    return user


def logout_user(request) -> None:
    user = request.user

    logger.info(
        "Пользователь вышёл из системы. user_id=%s username=%s",
        # getattr() возвращает None, если атрибута не существует
        getattr(user, "id", None),  # id может быть None
        getattr(user, "username", None),  # username может быть None
    )

    logout(request)


def get_users_for_admin_listing():
    # к каждому пользователю добавить поле files_count как количество файлов
    # и поле total_size как сумму размеров файлов — .annotate(...)
    return User.objects.annotate(
        files_count=Count("files"),  # анотация для подсчета количества файлов
        total_size=Coalesce(
            Sum("files__size"), Value(0)
        ),  # аннотация для подсчета суммы размеров файлов, Coalesce для замены NULL на 0
    ).order_by("id")


def get_admin_user_with_stats(user_id):
    try:
        return User.objects.annotate(
            files_count=Count("files"),
            total_size=Coalesce(Sum("files__size"), Value(0)),
        ).get(id=user_id)
    except User.DoesNotExist:
        raise NotFound("Пользователь не найден.")


def update_user_admin_status(actor, target_user_id, is_staff):
    """
    Обновляет статус пользователя в админке

    :param actor: Пользователь, который выполняет действие
    :type actor: User
    :param target_user_id: ID пользователя, которому нужно обновить статус
    :type target_user_id: int
    :param is_staff: Новый статус пользователя
    :type is_staff: bool
    """
    try:
        target_user = User.objects.get(id=target_user_id)
    except User.DoesNotExist:
        raise NotFound("Пользователь не найден.")

    if target_user.id == actor.id:
        logger.warning(
            "Попытка изменить собственный статус администратора. actor_id=%s actor_username=%s",
            actor.id,
            actor.username,
        )
        raise PermissionDenied("Вы не можете изменить свой собственный статус.")

    old_is_staff = target_user.is_staff
    target_user.is_staff = is_staff
    target_user.save(update_fields=["is_staff"])

    logger.info(
        "Изменён статус администратора. actor_id=%s actor_username=%s target_user_id=%s target_username=%s old_is_staff=%s new_is_staff=%s",
        actor.id,
        actor.username,
        target_user.id,
        target_user.username,
        old_is_staff,
        is_staff,
    )

    return target_user


def delete_user(actor, target_user_id) -> None:
    """
    Удаляет пользователя и все его физические файлы из хранилища.

    :param actor: Пользователь, который выполняет действие
    :type actor: User
    :param target_user_id: ID пользователя, которого нужно удалить
    :type target_user_id: int
    """
    try:
        target_user = User.objects.get(id=target_user_id)
    except User.DoesNotExist:
        raise NotFound("Пользователь не найден.")

    if target_user.id == actor.id:
        logger.warning(
            "Попытка удалить самого себя. actor_id=%s actor_username=%s",
            actor.id,
            actor.username,
        )
        raise PermissionDenied("Вы не можете удалить самого себя.")

    files_count = target_user.files.count()

    logger.info(
        "Начато удаление пользователя. actor_id=%s actor_username=%s target_user_id=%s target_username=%s files_count=%s",
        actor.id,
        actor.username,
        target_user.id,
        target_user.username,
        files_count,
    )

    for stored_file in target_user.files.all():
        stored_file.file.delete(
            save=False
        )  # удаляем файлы без сохранения в базе данных
        # Без сохранения потому, что через доли секунды мы всеравно удалим все Записи из БД
        # Чтобы не делать дополнительные запросы к БД и удалять по одной записи
        # Мы вначале удаляем все файлы и потом удаляем всего пользователя целиков
        # Вместе с записями о файлах в БД
    target_user.delete()

    logger.info(
        "Пользователь успешно удалён. actor_id=%s actor_username=%s target_user_id=%s",
        actor.id,
        actor.username,
        target_user_id,
    )
