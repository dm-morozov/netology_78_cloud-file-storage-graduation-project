from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.files.models import StoredFile

User = get_user_model()


class FileApiCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="Test_123",
        )
        self.client.login(username="testuser", password="Test_123")

    def test_upload_file_success(self):
        test_file = SimpleUploadedFile(
            "hello.txt",
            b"Hello, world!",
            content_type="text/plain",
        )

        response = self.client.post(
            reverse("file-list-create"),
            {
                "file": test_file,
                "comment": "Файл приветствия.",
            },
        )
        self.assertEqual(
            response.status_code, status.HTTP_201_CREATED, response.data
        )  # проверяем, что запрос прошёл успешно
        self.assertIn("file", response.data)  # проверяем, что файл был успешно загружен
        self.assertEqual(response.data["file"]["original_name"], "hello.txt")
        self.assertTrue(StoredFile.objects.filter(owner=self.user).exists())
