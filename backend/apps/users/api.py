from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, PermissionDenied

from django.urls import path

from common.permissions import IsStaffUser

from .serializers import (
    AdminUserListSerializer,
    AdminUserUpdateSerializer,
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
)
from .services import (
    get_users_for_admin_listing,
    login_user,
    logout_user,
    register_user,
    update_user_admin_status,
)


class RegisterApi(APIView):

    def post(self, request, *args, **kwargs):
        """
        Регистрация нового пользователя
        """

        serializer = RegisterSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        user = register_user(serializer.validated_data)

        return Response(
            {
                "message": f"Новый пользователь создан!",
                "user": {"id": user.id, "username": user.username, "email": user.email},
            },
            status=status.HTTP_201_CREATED,
        )


class LoginApi(APIView):

    def post(self, request, *args, **kwargs):
        """
        Авторизация пользователя
        """
        serializer = LoginSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = login_user(request, data["username"], data["password"])

        if user is None:
            return Response(
                {"detail": "Неверный логин или пароль"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Вход успешно выполнен!"}, status=status.HTTP_200_OK
        )


class MeApi(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutApi(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logout_user(request)

        return Response({"message": "Вы вышли из системы"}, status=status.HTTP_200_OK)

    # Чисто для теста, чтобы разлогиниться через браузер, потому что это всегда get запросы
    # def get(self, request, *args, **kwargs):
    #     logout(request)
    #     return Response(
    #         {'message': 'Вы вышли из системы'},
    #         status=status.HTTP_200_OK
    #     )


class AdminUserList(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request, *args, **kwargs):
        users = get_users_for_admin_listing()
        serializer = AdminUserListSerializer(instance=users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserDetailApi(APIView):
    """
    API для управления пользователями в админке
    """

    permission_classes = [IsStaffUser]

    def patch(self, request, user_id, *args, **kwargs):
        input_serializer = AdminUserUpdateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        try:
            target_user = update_user_admin_status(
                actor=request.user,
                target_user_id=user_id,
                is_staff=input_serializer.validated_data["is_staff"],
            )
        except (NotFound, PermissionDenied) as error:
            return Response(
                {"detail": str(error)},
                status=error.status_code,
            )

        output_serializer = UserSerializer(instance=target_user)
        return Response(output_serializer.data, status=status.HTTP_200_OK)


urlpatterns = [
    path("register/", RegisterApi.as_view(), name="register"),
    path("login/", LoginApi.as_view(), name="login"),
    path("me/", MeApi.as_view(), name="me"),
    path("logout/", LogoutApi.as_view(), name="logout"),
    path("users/", AdminUserList.as_view(), name="admin_user_list"),
    path(
        "users/<int:user_id>/", AdminUserDetailApi.as_view(), name="admin_user_detail"
    ),
]
