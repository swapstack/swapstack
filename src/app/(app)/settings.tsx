import type { NotificationPermissionStatus, SupportedLocale } from '@/core';
import type { ColorSchemeType } from '@/lib/hooks/use-selected-theme';
import { Link } from 'expo-router';
import * as React from 'react';
import { Uniwind } from 'uniwind';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Divider,
  Screen,
  Text,
  View,
} from '@/components/ui';
import { serviceProviders } from '@/lib/services';
import { getItem, setItem } from '@/lib/storage';

const SELECTED_THEME_KEY = 'SELECTED_THEME';

function AppearanceCard({
  selectedTheme,
  onSelectTheme,
}: {
  readonly selectedTheme: ColorSchemeType;
  readonly onSelectTheme: (theme: ColorSchemeType) => void;
}) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription testID="current-theme-label">
          {`Active theme: ${selectedTheme}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <View className="flex-row gap-2">
          {(['light', 'dark', 'system'] as const).map(theme => (
            <View key={theme} className="flex-1">
              <Button
                testID={`theme-${theme}-button`}
                size="sm"
                variant={selectedTheme === theme ? 'default' : 'outline'}
                label={theme.charAt(0).toUpperCase() + theme.slice(1)}
                onPress={() => onSelectTheme(theme)}
              />
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}

function LanguageCard({
  currentLocale,
  onSelectLocale,
}: {
  readonly currentLocale: SupportedLocale;
  readonly onSelectLocale: (locale: SupportedLocale) => void;
}) {
  const locales = serviceProviders.i18n.getAvailableLocales();
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{serviceProviders.i18n.t('settings.language')}</CardTitle>
        <CardDescription testID="current-locale-label">
          {`Active locale: ${currentLocale}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <View className="flex-row flex-wrap gap-2">
          {locales.map(item => (
            <Button
              key={item.code}
              testID={`locale-${item.code}-button`}
              size="sm"
              variant={currentLocale === item.code ? 'default' : 'outline'}
              label={item.label}
              onPress={() => onSelectLocale(item.code)}
            />
          ))}
        </View>
      </CardContent>
    </Card>
  );
}

export default function SettingsScreen() {
  const [selectedTheme, setSelectedThemeState] = React.useState<ColorSchemeType>(
    () => getItem<ColorSchemeType>(SELECTED_THEME_KEY) ?? 'system',
  );
  const [currentLocale, setCurrentLocale] = React.useState<SupportedLocale>(
    () => serviceProviders.i18n.getLocale(),
  );
  const [permissionStatus, setPermissionStatus] = React.useState<NotificationPermissionStatus>('undetermined');
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState<boolean>(
    () => serviceProviders.analytics.isEnabled(),
  );
  const [biometricLockEnabled, setBiometricLockEnabled] = React.useState(false);
  const [hasProEntitlement, setHasProEntitlement] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string>();

  React.useEffect(() => {
    let isMounted = true;
    const unsubscribeLocale = serviceProviders.i18n.onLocaleChange(loc => setCurrentLocale(loc));
    void Promise.all([
      serviceProviders.notifications.getPermissionStatus(),
      serviceProviders.billing.getEntitlements(),
      serviceProviders.biometrics.isAppLockEnabled(),
    ]).then(([perm, entitlements, appLock]) => {
      if (!isMounted) {
        return;
      }
      setPermissionStatus(perm);
      setHasProEntitlement(entitlements.some(e => e.id === 'pro' && e.isActive));
      setBiometricLockEnabled(appLock);
    });
    return () => {
      isMounted = false;
      unsubscribeLocale();
    };
  }, []);

  const handleSelectTheme = React.useCallback((theme: ColorSchemeType) => {
    setSelectedThemeState(theme);
    setItem(SELECTED_THEME_KEY, theme);
    Uniwind.setTheme(theme);
    void serviceProviders.analytics.track('theme_changed', { theme });
  }, []);

  const handleSelectLocale = React.useCallback(async (locale: SupportedLocale) => {
    await serviceProviders.i18n.setLocale(locale);
    setStatusMessage(`Language changed to ${locale.toUpperCase()}.`);
  }, []);

  const handleEnableNotifications = React.useCallback(async () => {
    const nextStatus = await serviceProviders.notifications.requestPermission();
    setPermissionStatus(nextStatus);
    setStatusMessage(
      nextStatus === 'granted'
        ? 'Push notifications enabled.'
        : 'Notification permission was not granted.',
    );
  }, []);

  const handleSendTestNotification = React.useCallback(async () => {
    const sent = await serviceProviders.notifications.scheduleLocal({
      title: 'Test notification',
      body: 'Notifications are configured and working.',
    });
    setStatusMessage(`Scheduled: ${sent.title}`);
  }, []);

  const handleToggleAnalytics = React.useCallback((checked: boolean) => {
    serviceProviders.analytics.setEnabled(checked);
    setAnalyticsEnabled(checked);
    setStatusMessage(checked ? 'Analytics enabled.' : 'Analytics disabled.');
  }, []);

  const handleToggleBiometricLock = React.useCallback(async (checked: boolean) => {
    const res = await serviceProviders.biometrics.setAppLockEnabled(checked);
    if (res.success) {
      setBiometricLockEnabled(checked);
      setStatusMessage(checked ? 'Biometric app lock enabled.' : 'Biometric app lock disabled.');
    }
  }, []);

  return (
    <Screen className="px-6 py-8">
      <Text className="font-bold text-3xl">{serviceProviders.i18n.t('settings.title')}</Text>
      <Text className="mt-1 text-base text-neutral-500 dark:text-neutral-400">
        Customize appearance, language, notifications, privacy, and subscription preferences.
      </Text>

      {statusMessage && (
        <Text testID="settings-status-message" className="mt-3 font-medium text-sm text-neutral-700 dark:text-neutral-300">
          {statusMessage}
        </Text>
      )}

      <AppearanceCard selectedTheme={selectedTheme} onSelectTheme={handleSelectTheme} />
      <LanguageCard currentLocale={currentLocale} onSelectLocale={handleSelectLocale} />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription testID="notification-permission-status">
            {`Permission status: ${permissionStatus}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissionStatus !== 'granted'
            ? (
                <Button
                  testID="enable-notifications-button"
                  variant="outline"
                  label="Enable notifications"
                  onPress={handleEnableNotifications}
                />
              )
            : (
                <Button
                  testID="test-notification-button"
                  variant="outline"
                  label="Send test notification"
                  onPress={handleSendTestNotification}
                />
              )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Privacy &amp; Analytics</CardTitle>
          <CardDescription>
            Control anonymous product usage and crash reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <View className="gap-3">
            <Checkbox
              testID="analytics-opt-in-checkbox"
              checked={analyticsEnabled}
              onChange={handleToggleAnalytics}
              label="Share anonymous usage analytics"
              accessibilityLabel="Share anonymous usage analytics"
            />
            <Checkbox
              testID="biometric-lock-checkbox"
              checked={biometricLockEnabled}
              onChange={handleToggleBiometricLock}
              label="Require Face ID / Biometrics on app resume"
              accessibilityLabel="Require Face ID / Biometrics on app resume"
            />
          </View>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription testID="settings-subscription-status">
            {hasProEntitlement ? 'Active plan: Pro' : 'Current plan: Free'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/paywall" asChild>
            <Button
              testID="settings-manage-subscription-button"
              variant="outline"
              label={hasProEntitlement ? 'Manage subscription' : 'Upgrade to Pro'}
            />
          </Link>
        </CardContent>
      </Card>

      <Divider className="my-6" />

      <View className="gap-3">
        <Link href="/profile" asChild>
          <Button testID="settings-profile-link" variant="outline" label="Manage profile" />
        </Link>
        <Link href="/devtools" asChild>
          <Button testID="settings-devtools-link" variant="outline" label="Open Developer Debug Studio" />
        </Link>
      </View>
    </Screen>
  );
}
