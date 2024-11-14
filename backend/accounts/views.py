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
    data_type = request.GET.get('type', 'historical')  # 'historical' or 'daily_change'

    if not symbols:
        return JsonResponse({'error': 'No stock symbols provided.'}, status=400)

    try:
        if data_type == 'historical':
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            
            data = yf.download(symbols, start=start_date, end=end_date, interval='1d')
            
            formatted_data = []
            for date, row in data.iterrows():
                entry = {'date': date.strftime('%Y-%m-%d')}
                for symbol in symbols:
                    try:
                        # Handle both single and multiple symbol cases
                        if len(symbols) > 1:
                            entry[symbol] = row['Close'][symbol]
                        else:
                            entry[symbol] = row['Close']
                    except Exception:
                        entry[symbol] = None
                formatted_data.append(entry)

            return JsonResponse(formatted_data, safe=False)

        elif data_type == 'daily_change':
            # Fetch today and yesterday's data for percentage change
            end_date = datetime.now()
            start_date = end_date - timedelta(days=2)
            
            data = yf.download(symbols, start=start_date, end=end_date, interval='1d')
            
            changes = {}
            for symbol in symbols:
                try:
                    # Get the last two days of closing prices
                    if len(symbols) > 1:
                        closes = data['Close'][symbol].tail(2)
                    else:
                        closes = data['Close'].tail(2)
                    
                    if len(closes) >= 2:
                        yesterday_price = closes.iloc[-2]
                        today_price = closes.iloc[-1]
                        percent_change = ((today_price - yesterday_price) / yesterday_price) * 100
                        
                        changes[symbol] = {
                            'current_price': round(today_price, 2),
                            'previous_price': round(yesterday_price, 2),
                            'percent_change': round(percent_change, 2)
                        }
                    else:
                        changes[symbol] = {
                            'error': 'Insufficient data'
                        }
                except Exception as e:
                    changes[symbol] = {
                        'error': str(e)
                    }
            
            return JsonResponse(changes)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


            
        
            