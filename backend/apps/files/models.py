from django.db import models

from django.conf import settings


def user_file_upload_to(stored_file, stored_name):
    """
    Формирует путь хранения файла.

    Пример:
    user_5/filename.jpg
    """

    return f"user_{stored_file.owner_id}/{stored_name}"


class StoredFile(models.Model):
    owner = models.ForeignKey(
        to=settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="files",
        verbose_name="владелец файла",
    )
    original_name = models.CharField(
        max_length=255, verbose_name="исходное/оригинальное имя файла"
    )
    stored_name = models.CharField(
        max_length=255, unique=True, verbose_name="уникальное имя файла на диске"
    )
    file = models.FileField(upload_to=user_file_upload_to, verbose_name="файл")
    size = models.PositiveBigIntegerField(verbose_name="размер файла в байтах")
    comment = models.TextField(blank=True, verbose_name="комментарий к файлу")
    uploaded_at = models.DateTimeField(
        auto_now_add=True, verbose_name="дата загрузки файла"
    )
    last_downloaded_at = models.DateTimeField(
        null=True, blank=True, verbose_name="дата последнего скачивания файла"
    )
    public_token = models.CharField(
        max_length=32,
        unique=True,
        null=True,
        blank=True,
        verbose_name="уникальный токен для публичного доступа к файлу",
    )

    class Meta:
        verbose_name = "Файл"
        verbose_name_plural = "Файлы"
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["owner"]),
            models.Index(fields=["public_token"]),
        ]

    def __str__(self):
        return self.original_name
