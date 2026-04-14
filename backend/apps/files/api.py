from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.urls import path

from .services import delete_user_file, get_user_files, upload_file, get_user_file
from .serializers import (
    StoredFileSerializer,
    UploadFileSerializer,
    StoredFileCreateResponseSerializer,
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

    def delete(self, request, file_id=None):
        if file_id is None:
            raise ValueError("file_id is required")
        file = get_user_file(request.user, file_id)
        file.delete()
        delete_user_file(file_id)


urlpatterns = [
    path("", FileListCreateApi.as_view(), name="file-list-create"),
    path("<int:file_id>/", FileDetailApi.as_view(), name="file-detail"),
]
