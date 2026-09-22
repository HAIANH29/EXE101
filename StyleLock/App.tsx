import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';

const linking = {
  prefixes: ['http://localhost:8082', 'http://localhost:8081', 'stylelock://'],
  config: {
    screens: {
      Login: '',
      SignUp: 'sign-up',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      Home: 'home',
      CameraUpload: 'camera',
      HairstyleSelect: 'hairstyles',
      HairstyleDetail: 'hairstyles/:id',
      TryOnEditor: 'try-on',
      SalonList: 'salons',
      SalonDetail: 'salons/:id',
      QuickBooking: 'booking/new',
      BookingStatus: 'booking/status',
      BookingHistory: 'bookings',
      Profile: 'profile',
      SalonDashboard: 'salon-dashboard',
      AdminDashboard: 'admin-dashboard'
    }
  }
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
