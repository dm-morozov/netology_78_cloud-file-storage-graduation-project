from rest_framework import serializers
from .models import User
import re

class RegisterSerializer(serializers.ModelSerializer):
    """
    Сериализатор для регистрации пользователя
    """
    # Валидируем данные с фронта (JSON)

    username = serializers.CharField(min_length=4, max_length=20)
    password = serializers.CharField(write_only=True, min_length=6)

    # Можно передать пустую строку, поле не является обязательным
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
        )

    def validate_username(self, value):
        pattern = r'^[a-zA-Z][a-zA-Z0-9]*$'

        if not re.fullmatch(pattern, value):
            raise serializers.ValidationError(
                "Логин должен начинаться с латинской буквы и содержать только латинские буквы и цифры."
            )
        
        return value
    
    def validate_password(self, value):
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError(
                'Пароль должен содержать хотя бы одну заглавную букву.'
            )

        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError(
                'Пароль должен содержать хотя бы одну цифру.'
            )

        if not re.search(r'[^a-zA-Z0-9]', value):
            raise serializers.ValidationError(
                'Пароль должен содержать хотя бы один специальный символ.'
            )

        return value
    

class LoginSerializer(serializers.Serializer):
    """
    Сериализатор для авторизации пользователя
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_staff',
        )