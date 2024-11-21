from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, OTP
from django.utils import timezone
from datetime import timedelta, datetime
from unittest.mock import patch, MagicMock
import json
import pandas as pd
import pytz

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

    def test_otp_validity(self):
        """Test OTP validity method"""
        # Test valid OTP (within 5 minutes)
        valid_otp = OTP.objects.create(
            email='test@example.com',
            otp='123456'
        )
        self.assertTrue(valid_otp.is_valid())

        # Test expired OTP (older than 5 minutes)
        expired_otp = OTP.objects.create(
            email='test2@example.com',
            otp='654321',
            created_at=timezone.now() - timedelta(minutes=6)
        )
        self.assertFalse(expired_otp.is_valid())

    def test_password_validation(self):
        """Test password validation in serializers"""
        # Test password length validation
        url = reverse('change_password')
        login_response = self.client.post(reverse('user_login'), self.user_data, format='json')
        token = login_response.data['tokens']['access']
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        data = {
            'old_password': 'testpass123',
            'new_password': 'short'  # Less than 8 characters
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_validation(self):
        """Test password reset validation"""
        url = reverse('reset_password')
        data = {
            'email': 'test@example.com',
            'password': 'newpass123',
            'confirm_password': 'different123'  # Mismatched passwords
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class StockAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
    @patch('yfinance.download')
    def test_stock_data_historical(self, mock_download):
        """Test historical stock data endpoint"""
        # Mock the yfinance download response
        mock_data = pd.DataFrame({
            'Close': [100, 101, 102],
            'Open': [99, 100, 101],
            'High': [102, 103, 104],
            'Low': [98, 99, 100],
            'Volume': [1000, 1100, 1200]
        }, index=pd.date_range('2024-01-01', periods=3))
        mock_download.return_value = mock_data

        url = reverse('stock_data')
        response = self.client.get(f'{url}?symbols=MARUTI.NS&type=historical')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        self.assertIn('data', data)
        self.assertIn('market_status', data)

    @patch('yfinance.download')
    def test_stock_data_daily_change(self, mock_download):
        """Test daily change stock data endpoint"""
        mock_data = pd.DataFrame({
            'Close': [100, 101],
            'Open': [99, 100],
            'High': [102, 103],
            'Low': [98, 99],
            'Volume': [1000, 1100]
        }, index=pd.date_range('2024-01-01', periods=2))
        mock_download.return_value = mock_data

        url = reverse('stock_data')
        response = self.client.get(f'{url}?symbols=MARUTI.NS&type=daily_change')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        self.assertIn('MARUTI.NS', data)
        self.assertIn('percent_change', data['MARUTI.NS'])

    @patch('yfinance.Ticker')
    @patch('pandas.read_csv')
    def test_get_stock_details(self, mock_read_csv, mock_ticker):
        """Test get stock details endpoint"""
        # Mock Ticker instance
        mock_ticker_instance = MagicMock()
        mock_ticker.return_value = mock_ticker_instance

        # Mock historical data
        hist_data = pd.DataFrame({
            'Close': [100, 101],
            'Open': [99, 100],
            'High': [102, 103],
            'Low': [98, 99],
            'Volume': [1000, 1100]
        }, index=pd.date_range('2024-01-01', periods=2))
        mock_ticker_instance.history.return_value = hist_data

        # Mock CSV data
        mock_forecast_df = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02'],
            'MARUTI.NS': [100, 101]
        })
        mock_sentiment_df = pd.DataFrame({
            'Company': ['Maruti'],
            'Positive': [0.6],
            'Negative': [0.2],
            'Neutral': [0.2],
            'Classification': ['Positive']
        })
        mock_financial_df = pd.DataFrame({
            'Company': ['Maruti Suzuki'],
            'Weighted_Score_2024': [0.8],
            'Classification': ['Good']
        })
        mock_recommendation_df = pd.DataFrame({
            'Company': ['Maruti Suzuki'],
            'Recommendation': ['Buy'],
            'Rationale': ['Good growth']
        })

        # Configure mock read_csv for different files
        def mock_read_csv_side_effect(filename):
            if 'combined_timemixer_forecast.csv' in filename:
                return mock_forecast_df
            elif 'sentiment_analysis.csv' in filename:
                return mock_sentiment_df
            elif 'company_weighted_scores_pivoted_with_classification.csv' in filename:
                return mock_financial_df
            elif 'recommendation.csv' in filename:
                return mock_recommendation_df
            return pd.DataFrame()

        mock_read_csv.side_effect = mock_read_csv_side_effect

        url = reverse('stock_details', kwargs={'stock_name': 'Maruti Suzuki'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        
        # Verify response structure
        self.assertIn('market', data)
        self.assertIn('forecast', data)
        self.assertIn('sentiment', data)
        self.assertIn('financial', data)
        self.assertIn('recommendation', data)

    def test_stock_data_invalid_symbol(self):
        """Test stock data with invalid symbol"""
        url = reverse('stock_data')
        response = self.client.get(f'{url}?symbols=INVALID')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stock_details_invalid_name(self):
        """Test stock details with invalid stock name"""
        url = reverse('stock_details', kwargs={'stock_name': 'Invalid Company'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('yfinance.download')
    def test_stock_data_market_closed(self, mock_download):
        """Test stock data when market is closed"""
        mock_data = pd.DataFrame({
            'Close': [100, 101],
            'Open': [99, 100],
            'High': [102, 103],
            'Low': [98, 99],
            'Volume': [1000, 1100]
        }, index=pd.date_range('2024-01-01', periods=2))
        mock_download.return_value = mock_data

        # Test during weekend
        with patch('django.utils.timezone.now') as mock_now:
            # Set to a Saturday
            mock_now.return_value = datetime(2024, 1, 6, 12, 0, tzinfo=pytz.UTC)
            url = reverse('stock_data')
            response = self.client.get(f'{url}?symbols=MARUTI.NS&type=historical')
            data = json.loads(response.content)
            self.assertEqual(data['market_status'], 'Closed')
