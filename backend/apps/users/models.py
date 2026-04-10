from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class User(AbstractUser):
    # Из абстрактного класса мы будем использовать следующие поля:
    # username — логин
    # first_name
    # last_name
    # password
    # email — переопределим, так как по умолчанию поле неуникально
    email = models.EmailField(unique=True)

    # признак администратора в приложении
    # is_staff — будет использоваться вместо поля is_admin

    # is_active — показывает активен ли пользователь
    # is_active=True — пользователю можно пользоваться аккаунтом
    # is_active=False — аккаунт отключён

    # Будем учитывать:
    # date_joined — дата регистрации
    # last_login — дата последнего входа

    def __str__(self):
        return self.username
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
    

