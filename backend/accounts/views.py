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
    
    # Market is closed if:
    # 1. It's after 3:30 PM
    # 2. It's before 9:15 AM
    # 3. It's a weekend
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


            
        
            