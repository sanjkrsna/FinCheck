from django.contrib import admin
from .models import User
from .forms import CustomUserChangeForm, CustomUserForm
from django.contrib.auth.admin import UserAdmin

@admin.register(User)
class CustomAdminUser(UserAdmin):
    add_form = CustomUserForm
    form = CustomUserChangeForm
    model = User