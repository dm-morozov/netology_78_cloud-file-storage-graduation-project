from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

from django.contrib.auth import get_user_model

User = get_user_model()


class AdminUserTest(APITestCase):
    # Для тестирования административных функций нам нужно создать как минимум одного администратора
    # и одного обычного пользователя.
    # Администратор будет использоваться для доступа к административным функциям,
    # а обычный пользователь будет использоваться для проверки ограничений доступа.
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="Admin_123",
            is_staff=True,
        )

        self.user = User.objects.create_user(
            username="user",
            password="User_123",
            email="user@example.com",
        )

        self.client.login(username="admin", password="Admin_123")

    # Тестируем список пользователей
    def test_admin_list_users(self):
        response = self.client.get(reverse("admin_user_list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        usernames = [item["username"] for item in response.data]
        self.assertIn("admin", usernames)
        self.assertIn("user", usernames)

        # Тестируем детали пользователя (у admin list есть агрегаты)
        self.assertIn("files_count", response.data[0])
        self.assertIn("total_size", response.data[0])

    def test_non_admin_cannot_access_list(self):
        self.client.logout()
        self.client.login(
            username="user",
            password="User_123",
        )

        response = self.client.get(reverse("admin_user_list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Тестируем обновление статуса администратора
    def test_update_is_staff(self):
        """
        Тестируем обновление статуса администратора
        """
        url = reverse("admin_user_detail", kwargs={"user_id": self.user.id})

        response = self.client.patch(
            url,
            {"is_staff": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()  # обновляем данные пользователя
        self.assertTrue(self.user.is_staff)
        self.assertTrue(response.data["is_staff"])

    def test_admin_cannot_update_self_is_staff(self):
        """
        Тестируем обновление статуса администратора у себя
        """
        url = reverse("admin_user_detail", kwargs={"user_id": self.admin.id})

        response = self.client.patch(
            url,
            {"is_staff": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_staff)

    # Тестируем удаление пользователя
    def test_delete_user(self):
        url = reverse("admin_user_detail", kwargs={"user_id": self.user.id})

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertFalse(User.objects.filter(id=self.user.id).exists())

    def test_admin_cannot_delete_self(self):
        """
        Тестируем удаление пользователя у себя
        """
        url = reverse("admin_user_detail", kwargs={"user_id": self.admin.id})

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(User.objects.filter(id=self.admin.id).exists())
