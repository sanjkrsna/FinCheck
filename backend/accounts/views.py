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

    if not symbols:
        return JsonResponse({'error': 'No stock symbols provided.'}, status=400)

    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    data = yf.download(symbols, start=start_date, end=end_date, interval='1d')

    formatted_data = []
    for date, row in data.iterrows():
        entry = {'date': date.strftime('%Y-%m-%d')}
        for symbol in symbols:
            entry[symbol] = row['Close'][symbols.index(symbol)]
        formatted_data.append(entry)

    return JsonResponse(formatted_data, safe=False)


            
        
            