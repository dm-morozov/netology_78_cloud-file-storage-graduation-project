from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound
from django.urls import path

from .services import (
    get_public_downloadable_file,
    mark_file_as_downloaded,
)


class FilePublicDownloadApi(APIView):
    def get(self, request, token, *args, **kwargs):
        try:
            stored_file = get_public_downloadable_file(token=token)

            # возвращаем файл, но возвращаем не просто через файл, а именно через FileResponse
            # Так как если файл большой, например 1Тб он не скачивался полность и не
            # забивал ОП, а передавал файл частями на сторону клиента

            file_handle = stored_file.file.open("rb")
            # Если файл существует и в БД и Локально, тогда меняем время скачивания
            mark_file_as_downloaded(stored_file)

            return FileResponse(
                file_handle,  # открываем файл для чтения в бинарном режиме
                as_attachment=True,  # т.е. файл нужно именно скачать, а не inline (открыть в браузере)
                filename=stored_file.original_name,
            )

        except NotFound as error:
            return Response({"detail": str(error)}, status=error.status_code)
        except FileNotFoundError:
            return Response(
                {"detail": "Файл не найден на сервере или недоступен"},
                status=status.HTTP_404_NOT_FOUND,
            )


urlpatterns = [
    path("<str:token>/", FilePublicDownloadApi.as_view(), name="public-file-download"),
]
