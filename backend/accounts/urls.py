from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import *

urlpatterns = [
    path('register/', UserRegistrationAPIView.as_view(),name='register_user'),
    path('login/', UserLoginAPIView.as_view(),name='user_login'),
    path('logout/', UserLogoutAPIView.as_view(),name='user_logout'),
    path('token/refresh/', TokenRefreshView.as_view(),name='refresh_token'),
    path('user/', UserInfoAPIView.as_view(),name="user_info"),
    path('stock-data/', stock_data, name='stock_data'),
]