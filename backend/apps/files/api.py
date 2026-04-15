from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
from django.urls import path

from .services import (
    delete_user_file,
    get_file_for_download,
    get_user_file,
    get_user_files,
    update_user_file,
    upload_file,
)
from .serializers import (
    StoredFileSerializer,
    UploadFileSerializer,
    StoredFileCreateResponseSerializer,
    FileUpdateSerializer,
)


class FileListCreateApi(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        input_serializer = UploadFileSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        data = input_serializer.validated_data
        uploaded_file = data["file"]
        comment = data.get("comment", "")

        stored_file = upload_file(
            owner=request.user, uploaded_file=uploaded_file, comment=comment
        )

        output_serializer = StoredFileCreateResponseSerializer(instance=stored_file)

        return Response(
            {
                "message": "Файл успешно загружен",
                "file": output_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    def get(self, request, *args, **kwargs):
        files = get_user_files(request.user)
        serializer = StoredFileSerializer(instance=files, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class FileDetailApi(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, file_id, *args, **kwargs):
        try:
            delete_user_file(request.user, file_id)
        except (NotFound, PermissionDenied) as error:
            return Response(
                {"detail": str(error)},
                status=error.status_code,
            )

        return Response(
            {
                "message": "Файл успешно удален",
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, file_id, *args, **kwargs):
        # Валидируем входящие данные
        # partial=True нужно для частичного обновления данных
        # Сериализатор игнорирует отсутствие обязательных полей
        serializer = FileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Вызываем сервис и передаем туда проверенные данные
        try:
            stored_file = update_user_file(
                owner=request.user, file_id=file_id, data=serializer.validated_data
            )
        except (NotFound, PermissionDenied) as error:
            return Response({"detail": str(error)}, status=error.status_code)

        # Возвращаем
        return Response(
            StoredFileSerializer(instance=stored_file).data,
            status=status.HTTP_200_OK,
        )

    def get(self, request, file_id, *args, **kwargs):
        stored_file = get_user_file(request.user, file_id)
        serializer = StoredFileSerializer(instance=stored_file)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FileDownloadApi(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, file_id, *args, **kwargs):
        try:
            stored_file = get_file_for_download(request.user, file_id)

            # возвращаем файл, но возвращаем не просто через файл, а именно через FileResponse
            # Так как если файл большой, например 1Тб он не скачивался полность и не
            # забивал ОП, а передавал файл частями на сторону клиента
            return FileResponse(
                stored_file.file.open("rb"),
                as_attachment=True,  # т.е. файл нужно именно скачать, а не inline (открыть в браузере)
                filename=stored_file.original_name,
            )

        # когда файл не найден или когда у пользователя нет прав
        except (NotFound, PermissionDenied) as error:
            return Response({"detail": str(error)}, status=error.status_code)
        except FileNotFoundError:
            return Response(
                {"detail": "Файл не найден на сервере или недоступен"},
                status=status.HTTP_404_NOT_FOUND,
            )


urlpatterns = [
    path("", FileListCreateApi.as_view(), name="file-list-create"),
    path("<int:file_id>/", FileDetailApi.as_view(), name="file-detail"),
    path("<int:file_id>/download/", FileDownloadApi.as_view(), name="file-download"),
]
