from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User

class CustomUserForm(UserCreationForm):
    model = User
    fields = ("email", "username", "first_name", "last_name")
    
class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = ("email", "username", "first_name", "last_name")

