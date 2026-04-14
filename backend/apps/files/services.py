from pathlib import Path
from uuid import uuid4
from .models import StoredFile


def upload_file(*, owner, uploaded_file, comment=""):
    """
    Сохраняет загруженный пользователем файл на диск и создаёт запись в БД.
    """

    original_name = uploaded_file.name
    suffix = Path(original_name).suffix
    stored_name = f"{uuid4()}{suffix}"

    stored_file = StoredFile(
        owner=owner,
        original_name=original_name,
        stored_name=stored_name,
        size=uploaded_file.size,
        comment=comment,
    )

    stored_file.file.save(
        stored_name, uploaded_file, save=False
    )  # file.save(имя_которое_хочешь, файл)
    # Улетает в FileField Нашей модели, где потом мы вызываем функцию
    stored_file.save()

    return stored_file


# функция получения файлов
def get_user_files(owner):
    return owner.files.all()


def get_user_file(owner, file_id):
    try:
        return owner.files.get(id=file_id)
    except StoredFile.DoesNotExist:
        raise ValueError("Файл не найден")


def delete_user_file(file_id):
    try:
        stored_file = StoredFile.objects.filter(id=file_id).first()
        stored_file.file.delete()
    except:
        raise ValueError("Файл не найден")
