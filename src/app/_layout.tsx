import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { StatusBar } from 'expo-status-bar';

import LoginScreen from '@/app/login';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { siapkanNotifikasiChat } from '@/config/notifikasi';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Sembunyikan native splash screen segera setelah navigasi siap
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void siapkanNotifikasiChat();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} hidden={false} />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
