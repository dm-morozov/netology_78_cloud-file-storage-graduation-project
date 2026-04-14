from rest_framework import serializers
from .models import StoredFile


class UploadFileSerializer(serializers.Serializer):
    file = serializers.FileField()
    comment = serializers.CharField(required=False, allow_blank=True)


class StoredFileCreateResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoredFile
        fields = ("id", "original_name", "comment", "size", "uploaded_at")
        read_only_fields = fields


class StoredFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoredFile
        fields = (
            "id",
            "original_name",
            "comment",
            "size",
            "uploaded_at",
            "last_downloaded_at",
            "public_token",
        )

        read_only_fields = fields
