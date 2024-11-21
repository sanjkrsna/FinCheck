from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, OTP
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch
import json

class AccountsAPITest(TestCase):
    def setUp(self):
        """Setup runs before each test"""
        self.client = APIClient()
        # Create test user with custom User model
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
    def test_user_registration_success(self):
        """Test successful user registration"""
        url = reverse('register_user')
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password1': 'newpass123',
            'password2': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='new@example.com').exists())
        self.assertIn('tokens', response.data)

    def test_user_registration_password_mismatch(self):
        """Test registration with mismatched passwords"""
        url = reverse('register_user')
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password1': 'newpass123',
            'password2': 'differentpass',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login_success(self):
        """Test successful login"""
        url = reverse('user_login')
        response = self.client.post(url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('email', response.data)

    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        url = reverse('user_login')
        data = {
            'email': 'test@example.com',
            'password': 'wrongpass'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_logout(self):
        """Test user logout"""
        # First login
        login_response = self.client.post(reverse('user_login'), self.user_data, format='json')
        token = login_response.data['tokens']['access']
        
        # Test logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('user_logout')
        response = self.client.post(url, {'refresh': login_response.data['tokens']['refresh']})
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)

    @patch('accounts.views.send_mail')
    def test_password_reset_flow(self, mock_send_mail):
        """Test complete password reset flow with OTP"""
        # 1. Request password reset
        request_url = reverse('request_password_reset')
        request_response = self.client.post(request_url, {'email': 'test@example.com'})
        self.assertEqual(request_response.status_code, status.HTTP_200_OK)
        self.assertTrue(mock_send_mail.called)

        # Get the OTP from database
        otp_obj = OTP.objects.get(email='test@example.com')
        
        # 2. Verify OTP
        verify_url = reverse('verify_otp')
        verify_response = self.client.post(verify_url, {
            'email': 'test@example.com',
            'otp': otp_obj.otp
        })
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)

        # 3. Reset Password
        reset_url = reverse('reset_password')
        reset_response = self.client.post(reset_url, {
            'email': 'test@example.com',
            'password': 'newpass123',
            'confirm_password': 'newpass123'
        })
        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)

        # Verify new password works
        login_response = self.client.post(reverse('user_login'), {
            'email': 'test@example.com',
            'password': 'newpass123'
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

    def test_expired_otp(self):
        """Test expired OTP handling"""
        otp = OTP.objects.create(
            email='test@example.com',
            otp='123456',
            created_at=timezone.now() - timedelta(minutes=6)
        )
        
        verify_url = reverse('verify_otp')
        response = self.client.post(verify_url, {
            'email': 'test@example.com',
            'otp': '123456'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_update(self):
        """Test profile update"""
        # Login first
        login_response = self.client.post(reverse('user_login'), self.user_data, format='json')
        token = login_response.data['tokens']['access']
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('update_profile')
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'username': 'updated_user'
        }
        response = self.client.put(url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify updates
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.first_name, 'Updated')
        self.assertEqual(user.username, 'updated_user')

    def test_change_password(self):
        """Test password change"""
        # Login first
        login_response = self.client.post(reverse('user_login'), self.user_data, format='json')
        token = login_response.data['tokens']['access']
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('change_password')
        data = {
            'old_password': 'testpass123',
            'new_password': 'newpass123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify new password works
        login_response = self.client.post(reverse('user_login'), {
            'email': 'test@example.com',
            'password': 'newpass123'
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
