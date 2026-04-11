from .models import User
from django.contrib.auth import login, authenticate, logout


def register_user(validated_data) -> User:
    """
    Регистрация нового пользователя

    :param validated_data: Сериализованные данные из формы регистрации
    :type validated_data: dict

    :return: Новый пользователь
    :rtype: User
    """
    
    # Используем именно create_user:
    # пароль хешируется, используется встроенная логика Django
    return User.objects.create_user(**validated_data)

def login_user(request, username, password) -> User | None:

    user = authenticate(
        request=request,
        username=username,
        password=password,
    )

    if user is None:
        return None
    
    login(request, user)
    return user

def logout_user(request) -> None:
    logout(request)