from django.shortcuts import render
from rest_framework.generics  import GenericAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import *
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from rest_framework.decorators import api_view
import yfinance as yf
from datetime import datetime, timedelta
import pytz
import pandas as pd
from django.http import HttpRequest
from django.http import QueryDict
from django.core.mail import send_mail
import random
from django.core.cache import cache
from rest_framework.views import APIView
from django.conf import settings
from .models import OTP
from django.utils import timezone


class UserRegistrationAPIView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = RefreshToken.for_user(user)
        data = serializer.data
        data['tokens'] = {'refresh':str(token),
                          'access':str(token.access_token)}
        
        return Response(data,status.HTTP_201_CREATED)

class UserLoginAPIView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserLoginSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # Ensure this is called
        user = serializer.validated_data  # Correctly use `validated_data` here
        
        # Serialize user data using the custom serializer
        user_data = CustomSerializer(user).data
        token = RefreshToken.for_user(user)
        
        # Add token information to the response data
        user_data['tokens'] = {
            'refresh': str(token),
            'access': str(token.access_token)
        }
        
        return Response(user_data, status=status.HTTP_200_OK)


class UserLogoutAPIView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status.HTTP_205_RESET_CONTENT)

        except Exception as e:
            return Response(status.HTTP_400_BAD_REQUEST)
        
class UserInfoAPIView(RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = CustomSerializer
    
    def get_object(self):
        return self.request.user
        

@api_view(['GET'])
def stock_data(request):
    symbols = request.GET.getlist('symbols')
    data_type = request.GET.get('type', 'historical')

    if not symbols:
        return JsonResponse({'error': 'No stock symbols provided.'}, status=400)

    ist = pytz.timezone('Asia/Kolkata')
    current_time = datetime.now(ist)
    current_date = current_time.date()
    
    # Determine market status
    current_hour = current_time.hour
    current_minute = current_time.minute
    is_weekend = current_time.weekday() >= 5
    
    market_closed = (
        is_weekend or 
        (current_hour > 15 or (current_hour == 15 and current_minute >= 30)) or
        (current_hour < 9 or (current_hour == 9 and current_minute < 15))
    )

    # Get yesterday's date
    yesterday = current_date - timedelta(days=1)
    
    # If it's weekend, get last Friday
    if is_weekend:
        days_to_subtract = current_time.weekday() - 4
        end_date = current_date - timedelta(days=days_to_subtract)
    else:
        end_date = yesterday if not market_closed else current_date

    try:
        if data_type == 'historical':
            start_date = end_date - timedelta(days=31)
            
            data = yf.download(symbols, start=start_date, end=end_date, interval='1d', progress=False)
            
            if not market_closed:
                data = data[:-1]
            
            formatted_data = []
            for date, row in data.iterrows():
                entry = {
                    'date': date.strftime('%Y-%m-%d'),
                }
                for symbol in symbols:
                    try:
                        if len(symbols) > 1:
                            entry[symbol] = round(row['Close'][symbol], 2)
                        else:
                            entry[symbol] = round(row['Close'], 2)
                    except Exception:
                        entry[symbol] = None
                formatted_data.append(entry)

            formatted_data = formatted_data[-30:]
            
            return JsonResponse({
                'data': formatted_data,
                'last_updated': formatted_data[-1]['date'],
                'market_status': 'Closed' if market_closed else 'Open'
            }, safe=False)

        elif data_type == 'daily_change':
            end_date = datetime.now()
            start_date = end_date - timedelta(days=5)
            
            data = yf.download(symbols, start=start_date, end=end_date, interval='1d', progress=False)
            
            if not market_closed:
                data = data[:-1]
            
            changes = {}
            for symbol in symbols:
                try:
                    if len(symbols) > 1:
                        closes = data['Close'][symbol]
                        dates = closes.index
                    else:
                        closes = data['Close']
                        dates = closes.index
                    
                    if len(closes) >= 2:
                        prev_day_price = closes.iloc[-1]
                        prev_prev_day_price = closes.iloc[-2]
                        last_trading_date = dates[-1].strftime('%Y-%m-%d')
                        percent_change = ((prev_day_price - prev_prev_day_price) / prev_prev_day_price) * 100
                        
                        changes[symbol] = {
                            'current_price': round(prev_day_price, 2),
                            'previous_price': round(prev_prev_day_price, 2),
                            'percent_change': round(percent_change, 2),
                            'as_of_date': last_trading_date,
                            'market_status': 'Closed' if market_closed else 'Open'
                        }
                    else:
                        changes[symbol] = {'error': 'Insufficient data'}
                except Exception as e:
                    changes[symbol] = {'error': str(e)}
            
            return JsonResponse(changes)

        elif data_type == 'individual':
            mode = request.GET.get('mode', 'historical')
            
            if mode == 'historical':
                end_date = datetime.now()
                start_date = end_date - timedelta(days=31)
                
                result = {}
                for symbol in symbols:
                    try:
                        data = yf.download(symbol, start=start_date, end=end_date, interval='1d', progress=False)
                        
                        if not market_closed:
                            data = data[:-1]
                        
                        stock_data = []
                        for date, row in data.iterrows():
                            stock_data.append({
                                'date': date.strftime('%Y-%m-%d'),
                                'open': float(row['Open'].iloc[0] if isinstance(row['Open'], pd.Series) else row['Open']),
                                'high': float(row['High'].iloc[0] if isinstance(row['High'], pd.Series) else row['High']),
                                'low': float(row['Low'].iloc[0] if isinstance(row['Low'], pd.Series) else row['Low']),
                                'close': float(row['Close'].iloc[0] if isinstance(row['Close'], pd.Series) else row['Close']),
                                'volume': int(row['Volume'].iloc[0] if isinstance(row['Volume'], pd.Series) else row['Volume'])
                            })
                        
                        result[symbol] = {
                            'data': stock_data[-30:],
                            'last_updated': stock_data[-1]['date'],
                            'market_status': 'Closed' if market_closed else 'Open'
                        }
                    except Exception as e:
                        result[symbol] = {'error': str(e)}
                
                return JsonResponse(result)
            
            elif mode == 'daily':
                end_date = datetime.now()
                start_date = end_date - timedelta(days=5)
                
                result = {}
                for symbol in symbols:
                    try:
                        data = yf.download(symbol, start=start_date, end=end_date, interval='1d', progress=False)
                        
                        if not market_closed:
                            data = data[:-1]
                        
                        if len(data) >= 2:
                            last_row = data.iloc[-1]
                            prev_row = data.iloc[-2]
                            
                            # Get values using iloc[0]
                            current_close = float(last_row['Close'].iloc[0] if isinstance(last_row['Close'], pd.Series) else last_row['Close'])
                            current_open = float(last_row['Open'].iloc[0] if isinstance(last_row['Open'], pd.Series) else last_row['Open'])
                            prev_close = float(prev_row['Close'].iloc[0] if isinstance(prev_row['Close'], pd.Series) else prev_row['Close'])
                            
                            day_change = current_close - current_open
                            day_change_percent = (day_change / current_open) * 100
                            prev_day_change = current_close - prev_close
                            prev_day_change_percent = (prev_day_change / prev_close) * 100
                            
                            result[symbol] = {
                                'current_price': current_close,
                                'open': float(last_row['Open'].iloc[0] if isinstance(last_row['Open'], pd.Series) else last_row['Open']),
                                'high': float(last_row['High'].iloc[0] if isinstance(last_row['High'], pd.Series) else last_row['High']),
                                'low': float(last_row['Low'].iloc[0] if isinstance(last_row['Low'], pd.Series) else last_row['Low']),
                                'volume': int(last_row['Volume'].iloc[0] if isinstance(last_row['Volume'], pd.Series) else last_row['Volume']),
                                'day_change': round(day_change, 2),
                                'day_change_percent': round(day_change_percent, 2),
                                'prev_day_change': round(prev_day_change, 2),
                                'prev_day_change_percent': round(prev_day_change_percent, 2),
                                'as_of_date': data.index[-1].strftime('%Y-%m-%d'),
                                'market_status': 'Closed' if market_closed else 'Open'
                            }
                        else:
                            result[symbol] = {'error': 'Insufficient data'}
                    except Exception as e:
                        result[symbol] = {'error': str(e)}
                
                return JsonResponse(result)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@api_view(['GET'])
def get_stock_details(request, stock_name):
    try:
        # Map stock names to symbols
        stock_symbols = {
            'Maruti Suzuki': 'MARUTI.NS',
            'Hero Motocorp': 'HEROMOTOCO.NS',
            'Bajaj Auto': 'BAJAJ-AUTO.NS',
            'TVS Motor Co': 'TVSMOTOR.NS'
        }
        
        symbol = stock_symbols.get(stock_name)
        if not symbol:
            return JsonResponse({'error': 'Invalid stock name'}, status=400)

        # Get historical data for the past 30 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        try:
            stock = yf.Ticker(symbol)
            hist_data = stock.history(start=start_date, end=end_date)
            
            historical_data = [
                {
                    'date': index.strftime('%Y-%m-%d'),
                    'price': float(row['Close']),
                    'volume': int(row['Volume'])
                }
                for index, row in hist_data.iterrows()
            ]
        except Exception as e:
            print(f"Error fetching historical data: {e}")
            historical_data = []

        # Get current market data using existing stock data function
        from django.http import HttpRequest
        from django.http import QueryDict
        
        market_request = HttpRequest()
        market_request.method = 'GET'
        query_dict = QueryDict('', mutable=True)
        query_dict.setlist('symbols', [symbol])
        query_dict['type'] = 'individual'
        query_dict['mode'] = 'daily'
        market_request.GET = query_dict
        
        market_response = stock_data(market_request)
        market_data = market_response.content.decode('utf-8')
        import json
        market_data = json.loads(market_data)
        market_info = market_data[symbol]

        # Get the rest of your data
        base_path = './updated_datas'

        # Get forecast data
        forecast_df = pd.read_csv(f'{base_path}/combined_timemixer_forecast.csv')
        forecast_data = forecast_df[['Date', symbol]].sort_values('Date').to_dict('records')

        # Get sentiment data
        sentiment_df = pd.read_csv(f'{base_path}/sentiment_analysis.csv')
        sentiment_row = sentiment_df[sentiment_df['Company'] == stock_name.split()[0]].iloc[0]
        sentiment_data = {
            'daily_sentiments': {
                col: sentiment_row[col] 
                for col in sentiment_df.columns 
                if col not in ['Company', 'Classification']
            },
            'classification': sentiment_row['Classification']
        }

        # Get financial data
        financial_df = pd.read_csv(f'{base_path}/company_weighted_scores_pivoted_with_classification.csv')
        financial_row = financial_df[financial_df['Company'] == stock_name].iloc[0]
        financial_data = {
            'yearly_scores': {
                col.replace('Weighted_Score_', ''): financial_row[col]
                for col in financial_df.columns 
                if col.startswith('Weighted_Score_') and pd.notna(financial_row[col])
            },
            'classification': financial_row['Classification'],
            'current_score': financial_row['Weighted_Score_2024']
        }

        # Get recommendation
        recommendation_df = pd.read_csv(f'{base_path}/recommendation.csv')
        recommendation_data = recommendation_df[recommendation_df['Company'] == stock_name].iloc[0].to_dict()

        response_data = {
            'market': {
                'current_price': market_info['current_price'],
                'open': market_info['open'],
                'high': market_info['high'],
                'low': market_info['low'],
                'volume': market_info['volume'],
                'day_change': market_info['day_change'],
                'day_change_percent': market_info['day_change_percent'],
                'as_of_date': market_info.get('as_of_date', end_date.strftime('%Y-%m-%d')),
                'market_status': market_info.get('market_status', 'Closed'),
                'historical_data': historical_data
            },
            'forecast': {
                'data': forecast_data,
                'projected_price': forecast_data[-1][symbol],
                'forecast_change_percent': round(((forecast_data[-1][symbol] - forecast_data[0][symbol]) / forecast_data[0][symbol]) * 100, 2),
                'forecast_period': {
                    'start': forecast_data[0]['Date'],
                    'end': forecast_data[-1]['Date']
                }
            },
            'sentiment': sentiment_data,
            'financial': financial_data,
            'recommendation': {
                'action': recommendation_data['Recommendation'],
                'rationale': recommendation_data['Rationale']
            }
        }

        return JsonResponse(response_data)

    except Exception as e:
        print(f"Error in get_stock_details: {e}")
        return JsonResponse({'error': str(e)}, status=400)


class RequestPasswordResetView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RequestPasswordResetSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        # Generate OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Store OTP in database
        OTP.objects.filter(email=email).delete()  # Remove any existing OTPs
        OTP.objects.create(email=email, otp=otp)
        
        # Send email
        send_mail(
            'Password Reset OTP',
            f'Your OTP for password reset is: {otp}. Valid for 5 minutes.',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        
        return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)

class VerifyOTPView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = VerifyOTPSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        
        try:
            otp_obj = OTP.objects.get(email=email, otp=otp)
            if not otp_obj.is_valid():
                otp_obj.delete()
                return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
            
            otp_obj.delete()  # Delete OTP after successful verification
            return Response({'message': 'OTP verified successfully'}, status=status.HTTP_200_OK)
            
        except OTP.DoesNotExist:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ResetPasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            user = User.objects.get(email=serializer.validated_data['email'])
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UpdateUserView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UpdateUserSerializer

    def put(self, request):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

class ChangePasswordView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Invalid old password'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)


            
        
            