from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers


class User(AbstractUser):
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = "email"
    
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    def __str__(self):
        return self.email


class OTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_valid(self):
        # OTP valid for 5 minutes
        return timezone.now() <= self.created_at + timedelta(minutes=5)
