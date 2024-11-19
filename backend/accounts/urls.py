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
    path('stock-details/<str:stock_name>/', get_stock_details, name='stock_details'),
    path('password/reset/request/', RequestPasswordResetView.as_view(), name='request_password_reset'),
    path('password/reset/verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('password/reset/confirm/', ResetPasswordView.as_view(), name='reset_password'),
    path('profile/update/', UpdateUserView.as_view(), name='update_profile'),
    path('password/change/', ChangePasswordView.as_view(), name='change_password'),
]