from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse


class RegisterApiTest(APITestCase):

    # РЕГИСТРАЦИЯ
    def test_register_success(self):
        url = reverse("register")

        data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "Test_123",
            "first_name": "Test",
            "last_name": "User",
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(
            response.status_code, status.HTTP_201_CREATED, response.data
        )  # Проверяем, что статус ответа 201 Created

        self.assertIn(
            "user", response.data
        )  # Проверяем, что в ответе есть данные о пользователе
        self.assertEqual(
            response.data["user"]["username"], "testuser"
        )  # Проверяем, что имя пользователя в ответе соответствует отправленному

    # ОШИБКА ВАЛИДАЦИИ
    def test_register_invalid_password(self):
        url = reverse("register")

        data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "123",  # плохой пароль
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)  # Проверяем, что в ответе есть ошибка


# АВТОРИЗАЦИЯ
class LoginApiTest(APITestCase):
    # Для тестирования авторизации нам нужно сначала зарегистрировать пользователя,
    # чтобы потом попытаться войти с его данными.
    def setUp(self):
        self.user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "Test_123",
        }

        self.client.post(reverse("register"), self.user_data, format="json")

    # УСПЕШНАЯ АВТОРИЗАЦИЯ
    def test_login_success(self):
        response = self.client.post(
            reverse("login"),
            {"username": "testuser", "password": "Test_123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

    def test_login_wrong_password(self):
        """
        Тестируем вход с неверным паролем
        """
        response = self.client.post(
            reverse("login"),
            {"username": "testuser", "password": "Wrong_123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

    # Me ПРОВЕРКА ПОЛУЧЕНИЯ ДАННЫХ О СЕБЕ
    def test_me_authenticated(self):
        self.client.post(
            reverse("login"),
            {"username": "testuser", "password": "Test_123"},
            format="json",
        )

        response = self.client.get(reverse("me"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "testuser", response.data)

    # ВЫХОД ИЗ СИСТЕМЫ
    def test_logout(self):
        self.client.post(
            reverse("login"),
            {"username": "testuser", "password": "Test_123"},
            format="json",
        )

        response = self.client.post(reverse("logout"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # После выхода из системы запрос к me должен возвращать 403 Forbidden,
        # так как пользователь больше не аутентифицирован
        me_response = self.client.get(reverse("me"))
        self.assertEqual(me_response.status_code, status.HTTP_403_FORBIDDEN)
