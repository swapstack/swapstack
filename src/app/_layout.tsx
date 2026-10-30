import Inter_400Regular from '@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf';
import Inter_500Medium from '@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf';
import Inter_600SemiBold from '@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf';
import Inter_700Bold from '@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { ErrorBoundary as RouterErrorBoundary, Stack } from 'expo-router';
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

let initialProviderConfigError: Error | null = null;
try {
  validateProviderConfig();
}
catch (error) {
  initialProviderConfigError = error instanceof Error ? error : new Error('Invalid provider configuration.');
}

void SplashScreen.preventAutoHideAsync();
loadSelectedTheme();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [sessionReady, setSessionReady] = React.useState(false);
  const [providerConfigError, setProviderConfigError] = React.useState(initialProviderConfigError);
  const theme = useThemeConfig();
  const ready = (fontsLoaded || fontError) && sessionReady;

  React.useEffect(() => {
    if (ready || providerConfigError) {
      void SplashScreen.hideAsync();
    }
  }, [ready, providerConfigError]);

  const handleSessionReady = React.useCallback(() => {
    setSessionReady(true);
  }, []);
  const retryProviderConfig = React.useCallback(async () => {
    try {
      validateProviderConfig();
      setProviderConfigError(null);
    }
    catch (error) {
      setProviderConfigError(error instanceof Error ? error : new Error('Invalid provider configuration.'));
    }
  }, []);

  if (providerConfigError) {
    return <RouterErrorBoundary error={providerConfigError} retry={retryProviderConfig} />;
  }

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
