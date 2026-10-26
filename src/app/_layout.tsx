import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastContainer } from '@/components/ui';
import { useThemeConfig } from '@/components/ui/use-theme-config';
import { AuthSessionProvider } from '@/features/auth/session';
import { APIProvider } from '@/lib/api';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { validateProviderConfig } from '@/lib/providers';

import '../global.css';

export { ErrorBoundary } from 'expo-router';

void SplashScreen.preventAutoHideAsync();
loadSelectedTheme();
validateProviderConfig();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [sessionReady, setSessionReady] = React.useState(false);
  const theme = useThemeConfig();
  const ready = (fontsLoaded || fontError) && sessionReady;

  React.useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  const handleSessionReady = React.useCallback(() => {
    setSessionReady(true);
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <APIProvider>
            <ThemeProvider value={theme}>
              <BottomSheetModalProvider>
                <AuthSessionProvider onReady={handleSessionReady}>
                  <Stack screenOptions={{ headerShown: false }} />
                  <ToastContainer />
                </AuthSessionProvider>
              </BottomSheetModalProvider>
            </ThemeProvider>
          </APIProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
