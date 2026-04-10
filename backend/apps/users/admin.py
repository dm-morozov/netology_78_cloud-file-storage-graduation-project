from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User

# Register your models here.
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        'id',
        'username',
        'email',
        'first_name',
        'last_name',
        'is_staff',
        'is_active',
        'date_joined',
        'last_login',
    )
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('id',)
