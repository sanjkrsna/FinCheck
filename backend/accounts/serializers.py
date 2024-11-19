from .models import User
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.mail import send_mail
import random
from django.core.cache import cache

class CustomSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id","username","email","first_name","last_name")
        
class UserRegistrationSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ("id","username","email","first_name","last_name","password1","password2")
        extra_kwargs = {"password":{"write_only":True}}
    def validate(self,attrs):
        if attrs['password1'] != attrs['password2']:
            raise serializers.ValidationError("Password do not match")
        
        password = attrs.get("password1","")
        if len(password) < 8:
            raise serializers.ValidationError("Password should at least be 8 characters long")
        
        return attrs
    
    def create(self, validated_data):
        # Remove both password fields from validated data
        password = validated_data.pop("password1")
        validated_data.pop("password2")  # We don't need this anymore
        
        # Create user with remaining validated data
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=password
        )
        
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        # Access the email and password fields correctly from attrs
        email = attrs.get("email")
        password = attrs.get("password")
        
        # Authenticate user
        user = authenticate(email=email, password=password)
        if user and user.is_active:
            return user  # return the user object if authenticated successfully
        
        # Raise validation error if authentication fails
        raise serializers.ValidationError("Incorrect Credentials")

class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email address.")

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField()

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return data

class UpdateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'username')

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    
    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long")
        return value