from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from django.urls import path

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from .services import login_user, logout_user, register_user


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
                'message': f'Новый пользователь создан!',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            },
            status=status.HTTP_201_CREATED
        )
    

class LoginApi(APIView):

    def post(self, request, *args, **kwargs):
        """
        Авторизация пользователя
        """
        serializer = LoginSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = login_user(request, data['username'], data['password'])

        if user is None:
            return Response(
                {'detail': 'Неверный логин или пароль'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {'message': 'Вход успешно выполнен!'},
            status=status.HTTP_200_OK
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

        return Response(
            {'message': 'Вы вышли из системы'},
            status=status.HTTP_200_OK
        )
    
    # Чисто для теста, чтобы разлогиниться через браузер, потому что это всегда get запросы
    # def get(self, request, *args, **kwargs):
    #     logout(request)
    #     return Response(
    #         {'message': 'Вы вышли из системы'},
    #         status=status.HTTP_200_OK
    #     )


urlpatterns = [
    path('register/', RegisterApi.as_view()),
    path('login/', LoginApi.as_view()),
    path('me/', MeApi.as_view()),
    path('logout/', LogoutApi.as_view()),
]