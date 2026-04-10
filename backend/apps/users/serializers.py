from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    """
    Сериализатор для регистрации пользователя
    """
    # Валидируем данные с фронта (JSON)
    password = serializers.CharField(write_only=True)

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

    def create(self, validated_data):
        # Используем именно create_user:
        # пароль хешируется, используется встроенная логика Django
        return User.objects.create_user(**validated_data)
    

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