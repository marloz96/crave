import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold_Italic,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '@/lib/session';
import { colors, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold_Italic,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            headerTitleStyle: { fontFamily: fonts.bold, color: colors.navy },
            headerTintColor: colors.violet,
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="match" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="job/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="seeker/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="employer/job-edit" options={{ headerShown: true, title: 'Position' }} />
          <Stack.Screen name="employer/verify" options={{ headerShown: true, title: 'Get verified' }} />
          <Stack.Screen name="employer/plans" options={{ headerShown: true, title: 'Plans' }} />
        </Stack>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
