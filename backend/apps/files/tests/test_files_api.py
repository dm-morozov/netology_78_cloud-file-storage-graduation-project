from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from pathlib import Path
from apps.files.models import StoredFile

import shutil  # удаляет папку вместе со всем содержимым
import tempfile  # создаёт временную папку
from django.test import (
    override_settings,
)  # временно меняет настройки Django (например, MEDIA_ROOT) для тестов

User = get_user_model()


class FileApiCase(APITestCase):
    def setUp(self):
        # Создаётся отдельная временная папка
        self.temp_media_dir = tempfile.mkdtemp()
        # на время теста Django начинает сохранять файлы не в обычный media/,
        # а во временную папку
        self.override = override_settings(MEDIA_ROOT=self.temp_media_dir)
        self.override.enable()

        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="Test_123",
        )

        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="Other_123",
        )

        self.client.login(username="testuser", password="Test_123")

    def tearDown(self):
        # Возвращаем обычные настройки обратно
        self.override.disable()
        # Удаляем временную папку полностью вместе со всеми файлами
        shutil.rmtree(self.temp_media_dir, ignore_errors=True)

    def create_test_file(
        self, name="hello.txt", content=b"Hello, world!", comment="Файл приветствия."
    ):
        test_file = SimpleUploadedFile(
            name,
            content,
            content_type="text/plain",
        )

        return self.client.post(
            reverse("file-list-create"),
            {
                "file": test_file,
                "comment": comment,
            },
            format="multipart",
        )

    def login_as(self, username, password):
        self.client.logout()
        self.client.login(username=username, password=password)

    def test_upload_file_success(self):

        response = self.create_test_file()

        self.assertEqual(
            response.status_code, status.HTTP_201_CREATED, response.data
        )  # проверяем, что запрос прошёл успешно
        self.assertIn("file", response.data)

        # проверяем, что файл был успешно загружен
        stored_file = StoredFile.objects.get(owner=self.user)
        with stored_file.file.open("rb") as file:
            content = file.read()

        self.assertEqual(content, b"Hello, world!")
        self.assertEqual(response.data["file"]["original_name"], "hello.txt")
        self.assertEqual(response.data["file"]["comment"], "Файл приветствия.")
        self.assertTrue(StoredFile.objects.filter(owner=self.user).exists())

    def test_list_files(self):
        """
        Тест проверяет получение списка файлов текущего пользователя.
        """

        first_upload_response = self.create_test_file(
            name="hello.txt",
            content=b"Hello, world!",
            comment="Первый файл",
        )
        self.assertEqual(
            first_upload_response.status_code,
            status.HTTP_201_CREATED,
            first_upload_response.data,
        )

        second_upload_response = self.create_test_file(
            name="notes.txt",
            content=b"My notes",
            comment="Второй файл",
        )
        self.assertEqual(
            second_upload_response.status_code,
            status.HTTP_201_CREATED,
            second_upload_response.data,
        )

        response = self.client.get(reverse("file-list-create"))

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(len(response.data), 2)

        self.assertEqual(response.data[0]["original_name"], "notes.txt")
        self.assertEqual(response.data[0]["comment"], "Второй файл")

        self.assertEqual(response.data[1]["original_name"], "hello.txt")
        self.assertEqual(response.data[1]["comment"], "Первый файл")

    def test_unauthenticated_user_cannot_upload_file(self):
        self.client.logout()

        response = self.create_test_file()

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_list_files(self):
        self.client.logout()

        response = self.client.get(reverse("file-list-create"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_file_delete_success(self):
        """
        Тест проверяет успешное удаление файла.
        """

        upload_response = self.create_test_file()

        self.assertEqual(
            upload_response.status_code,
            status.HTTP_201_CREATED,
            upload_response.data,
        )

        stored_file = StoredFile.objects.get(owner=self.user)
        file_path = Path(stored_file.file.path)

        # Проверяем, что файл существует на диске
        self.assertTrue(file_path.exists())

        # Удаляем файл
        delete_response = self.client.delete(
            reverse("file-detail", kwargs={"file_id": stored_file.id})
        )

        self.assertEqual(
            delete_response.status_code,
            status.HTTP_200_OK,
            delete_response.data,
        )

        # Проверяем, что запись удалена из БД
        self.assertFalse(StoredFile.objects.filter(id=stored_file.id).exists())

        self.assertFalse(file_path.exists())

    def test_get_file_detail_success(self):
        """
        Тест проверяет получение информации об одном файле.
        """

        upload_response = self.create_test_file()

        self.assertEqual(
            upload_response.status_code,
            status.HTTP_201_CREATED,
            upload_response.data,
        )

        stored_file = StoredFile.objects.get(owner=self.user)

        response = self.client.get(
            reverse("file-detail", kwargs={"file_id": stored_file.id})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["id"], stored_file.id)
        self.assertEqual(response.data["original_name"], "hello.txt")
        self.assertEqual(response.data["comment"], "Файл приветствия.")

    def test_update_file_success(self):
        """
        Тест проверяет успешное обновление имени и комментария файла.
        """

        upload_response = self.create_test_file()

        self.assertEqual(
            upload_response.status_code,
            status.HTTP_201_CREATED,
            upload_response.data,
        )

        stored_file = StoredFile.objects.get(owner=self.user)

        response = self.client.patch(
            reverse("file-detail", kwargs={"file_id": stored_file.id}),
            {"original_name": "new_name.txt", "comment": "Новый комментарий"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        stored_file.refresh_from_db()

        self.assertEqual(stored_file.original_name, "new_name.txt")
        self.assertEqual(stored_file.comment, "Новый комментарий")
        self.assertEqual(response.data["comment"], "Новый комментарий")
        self.assertEqual(response.data["original_name"], "new_name.txt")

    def test_download_file_success(self):
        """
        Тест проверяет успешное скачивание файла.
        """

        upload_response = self.create_test_file()

        self.assertEqual(
            upload_response.status_code,
            status.HTTP_201_CREATED,
            upload_response.data,
        )

        stored_file = StoredFile.objects.get(owner=self.user)

        response = self.client.get(
            reverse("file-download", kwargs={"file_id": stored_file.id}),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # проверяем, что заголовок Content-Disposition содержит имя файла
        self.assertEqual(
            response["Content-Disposition"],
            # Django автоматически экранирует кавычки в имени файла,
            # поэтому мы должны учесть это в тесте
            'attachment; filename="hello.txt"',
        )

    def test_create_public_link_success(self):
        """
        Тест проверяет успешное создание публичной ссылки для файла.
        """

        upload_response = self.create_test_file()

        self.assertEqual(
            upload_response.status_code,
            status.HTTP_201_CREATED,
            upload_response.data,
        )

        stored_file = StoredFile.objects.get(owner=self.user)

        response = self.client.post(
            reverse("file-public-link", kwargs={"file_id": stored_file.id}),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIn("public_token", response.data)
        self.assertIn("public_url", response.data)

        stored_file.refresh_from_db()
        self.assertIsNotNone(stored_file.public_token)
        self.assertEqual(response.data["public_token"], stored_file.public_token)

    def test_public_file_download_success(self):
        upload_response = self.create_test_file()
        self.assertEqual(upload_response.status_code, status.HTTP_201_CREATED)
        stored_file = StoredFile.objects.get(owner=self.user)
        public_link_response = self.client.post(
            reverse("file-public-link", kwargs={"file_id": stored_file.id})
        )
        self.assertEqual(public_link_response.status_code, status.HTTP_200_OK)

        self.client.logout()
        token = public_link_response.data["public_token"]

        response = self.client.get(
            reverse("public-file-download", kwargs={"token": token})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response["Content-Disposition"],
            'attachment; filename="hello.txt"',
        )

    def test_list_files_returns_only_current_user_files(self):
        """
        Тест проверяет, что пользователь видит только свои файлы.
        """

        self.create_test_file(
            name="my_file.txt",
            content=b"My file",
            comment="Мой файл",
        )

        self.login_as("otheruser", "Other_123")

        self.create_test_file(
            name="other_file.txt",
            content=b"Other file",
            comment="Чужой файл",
        )

        self.login_as("testuser", "Test_123")

        response = self.client.get(reverse("file-list-create"))

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["original_name"], "my_file.txt")
        self.assertEqual(response.data[0]["comment"], "Мой файл")

    def test_last_downloaded_at_updates_on_download(self):
        """
        Тест проверяет, что поле last_downloaded_at обновляется при скачивании файла.
        """

        upload_response = self.create_test_file()

        self.assertEqual(
            upload_response.status_code,
            status.HTTP_201_CREATED,
            upload_response.data,
        )

        stored_file = StoredFile.objects.get(owner=self.user)

        # До скачивания поле должно быть пустым
        self.assertIsNone(stored_file.last_downloaded_at)

        # Скачиваем файл
        response = self.client.get(
            reverse("file-download", kwargs={"file_id": stored_file.id})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Обновляем объект из базы
        stored_file.refresh_from_db()

        # После скачивания поле должно заполниться
        self.assertIsNotNone(stored_file.last_downloaded_at)

    def test_user_cannot_get_detail_of_other_user_file(self):
        """
        Тест проверяет, что обычный пользователь не может получить чужой файл.
        """

        self.login_as(username="otheruser", password="Other_123")

        self.create_test_file(
            name="other_file.txt",
            content=b"Other file content",
            comment="Файл другого пользователя",
        )

        other_file = StoredFile.objects.get(owner=self.other_user)

        self.login_as(username="testuser", password="Test_123")

        response = self.client.get(
            reverse("file-detail", kwargs={"file_id": other_file.id})
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
        self.assertEqual(
            response.data["detail"], "У вас нет прав для доступа к этому файлу."
        )

    def test_user_cannot_update_other_user_file(self):
        """
        Тест проверяет, что обычный пользователь не может изменить чужой файл.
        """

        self.login_as(username="otheruser", password="Other_123")

        self.create_test_file(
            name="other_file.txt",
            content=b"Other file content",
            comment="Файл другого пользователя",
        )

        other_file = StoredFile.objects.get(owner=self.other_user)

        self.login_as(username="testuser", password="Test_123")

        response = self.client.patch(
            reverse("file-detail", kwargs={"file_id": other_file.id}),
            {
                "original_name": "hacked.txt",
                "comment": "Попытка изменить чужой файл",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
        self.assertEqual(
            response.data["detail"], "У вас нет прав для доступа к этому файлу."
        )

        other_file.refresh_from_db()
        self.assertEqual(other_file.original_name, "other_file.txt")
        self.assertEqual(other_file.comment, "Файл другого пользователя")

    def test_user_cannot_delete_other_user_file(self):
        """
        Тест проверяет, что обычный пользователь не может удалить чужой файл.
        """

        self.login_as(username="otheruser", password="Other_123")

        self.create_test_file(
            name="other_file.txt",
            content=b"Other file content",
            comment="Файл другого пользователя",
        )

        other_file = StoredFile.objects.get(owner=self.other_user)
        file_path = Path(other_file.file.path)

        self.assertTrue(file_path.exists())

        self.login_as(username="testuser", password="Test_123")

        response = self.client.delete(
            reverse("file-detail", kwargs={"file_id": other_file.id})
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
        self.assertEqual(
            response.data["detail"], "У вас нет прав для доступа к этому файлу."
        )

        self.assertTrue(StoredFile.objects.filter(id=other_file.id).exists())
        self.assertTrue(file_path.exists())

    def test_user_cannot_list_other_user_files_by_owner_id(self):
        """
        Тест проверяет, что обычный пользователь не может смотреть чужое хранилище через owner_id.
        """

        self.login_as(username="otheruser", password="Other_123")

        self.create_test_file(
            name="other_file.txt",
            content=b"Other file content",
            comment="Файл другого пользователя",
        )

        self.login_as(username="testuser", password="Test_123")

        response = self.client.get(
            reverse("file-list-create"),
            {"owner_id": self.other_user.id},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
        self.assertEqual(
            response.data["detail"],
            "У вас нет прав для просмотра чужого хранилища.",
        )

    def test_admin_can_list_other_user_files_by_owner_id(self):
        """
        Тест проверяет, что администратор может смотреть чужое хранилище через owner_id.
        """

        User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="Admin_123",
            is_staff=True,
        )

        self.login_as(username="otheruser", password="Other_123")

        self.create_test_file(
            name="other_file.txt",
            content=b"Other file content",
            comment="Файл другого пользователя",
        )

        self.login_as(username="adminuser", password="Admin_123")

        response = self.client.get(
            reverse("file-list-create"),
            {"owner_id": self.other_user.id},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["original_name"], "other_file.txt")
        self.assertEqual(response.data[0]["comment"], "Файл другого пользователя")
