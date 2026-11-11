import type { NotificationPermissionStatus } from '@/core';
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

export default function SettingsScreen() {
  const [selectedTheme, setSelectedThemeState] = React.useState<ColorSchemeType>(
    () => getItem<ColorSchemeType>(SELECTED_THEME_KEY) ?? 'system',
  );
  const [permissionStatus, setPermissionStatus] = React.useState<NotificationPermissionStatus>('undetermined');
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState<boolean>(
    () => serviceProviders.analytics.isEnabled(),
  );
  const [hasProEntitlement, setHasProEntitlement] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string>();

  React.useEffect(() => {
    let isMounted = true;
    void Promise.all([
      serviceProviders.notifications.getPermissionStatus(),
      serviceProviders.billing.getEntitlements(),
    ]).then(([perm, entitlements]) => {
      if (!isMounted) {
        return;
      }
      setPermissionStatus(perm);
      setHasProEntitlement(entitlements.some(e => e.id === 'pro' && e.isActive));
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectTheme = React.useCallback((theme: ColorSchemeType) => {
    setSelectedThemeState(theme);
    setItem(SELECTED_THEME_KEY, theme);
    Uniwind.setTheme(theme);
    void serviceProviders.analytics.track('theme_changed', { theme });
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

  return (
    <Screen className="px-6 py-8">
      <Text className="font-bold text-3xl">Settings</Text>
      <Text className="mt-1 text-base text-neutral-500 dark:text-neutral-400">
        Customize appearance, notifications, privacy, and subscription preferences.
      </Text>

      {statusMessage && (
        <Text testID="settings-status-message" className="mt-3 font-medium text-sm text-neutral-700 dark:text-neutral-300">
          {statusMessage}
        </Text>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription testID="current-theme-label">
            {`Active theme: ${selectedTheme}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                testID="theme-light-button"
                size="sm"
                variant={selectedTheme === 'light' ? 'default' : 'outline'}
                label="Light"
                onPress={() => handleSelectTheme('light')}
              />
            </View>
            <View className="flex-1">
              <Button
                testID="theme-dark-button"
                size="sm"
                variant={selectedTheme === 'dark' ? 'default' : 'outline'}
                label="Dark"
                onPress={() => handleSelectTheme('dark')}
              />
            </View>
            <View className="flex-1">
              <Button
                testID="theme-system-button"
                size="sm"
                variant={selectedTheme === 'system' ? 'default' : 'outline'}
                label="System"
                onPress={() => handleSelectTheme('system')}
              />
            </View>
          </View>
        </CardContent>
      </Card>

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
          <Checkbox
            testID="analytics-opt-in-checkbox"
            checked={analyticsEnabled}
            onChange={handleToggleAnalytics}
            label="Share anonymous usage analytics"
            accessibilityLabel="Share anonymous usage analytics"
          />
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

      <Link href="/profile" asChild>
        <Button testID="settings-profile-link" variant="outline" label="Manage profile" />
      </Link>
    </Screen>
  );
}
