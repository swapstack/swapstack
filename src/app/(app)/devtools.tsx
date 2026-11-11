import type { FeatureFlagsSnapshot } from '@/core';
import { Link } from 'expo-router';
import * as React from 'react';

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
import { mockBillingProvider, mockNetworkProvider } from '@/core';
import { serviceProviders } from '@/lib/services';

const BOOLEAN_FLAGS = ['new_paywall_layout', 'onboarding_v2', 'ai_assistant_beta'] as const;

export default function DevToolsScreen() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [hasPro, setHasPro] = React.useState(false);
  const [flags, setFlags] = React.useState<FeatureFlagsSnapshot>({});

  React.useEffect(() => {
    let mounted = true;
    void Promise.all([
      serviceProviders.network.isOnline(),
      serviceProviders.billing.getEntitlements(),
      serviceProviders.featureFlags.getAllFlags(),
    ]).then(([online, entitlements, allFlags]) => {
      if (!mounted) {
        return;
      }
      setIsOnline(online);
      setHasPro(entitlements.some(e => e.id === 'pro' && e.isActive));
      setFlags(allFlags);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleNetwork = React.useCallback(() => {
    const next = !isOnline;
    mockNetworkProvider.setOnline(next);
    setIsOnline(next);
  }, [isOnline]);

  const handleTogglePro = React.useCallback(async () => {
    if (hasPro) {
      mockBillingProvider.reset();
      setHasPro(false);
    }
    else {
      const updated = await serviceProviders.billing.purchase('pro_monthly');
      setHasPro(updated.some(e => e.id === 'pro' && e.isActive));
    }
  }, [hasPro]);

  const handleToggleFlag = React.useCallback(
    async (flagKey: string, enabled: boolean) => {
      await serviceProviders.featureFlags.setOverride(flagKey, enabled);
      const updated = await serviceProviders.featureFlags.getAllFlags();
      setFlags(updated);
    },
    [],
  );

  return (
    <Screen className="px-6 py-8">
      <Text className="font-bold text-3xl">Developer Debug Studio</Text>
      <Text className="mt-1 text-base text-neutral-500 dark:text-neutral-400">
        Simulate runtime network state, subscription entitlements, and feature flags without rebuilding.
      </Text>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Network Simulation</CardTitle>
          <CardDescription testID="devtools-network-status">
            {isOnline ? 'Network status: Online (wifi)' : 'Network status: Offline (queued sync active)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            testID="devtools-toggle-network-button"
            variant="outline"
            label={isOnline ? 'Simulate Offline Mode' : 'Reconnect Network'}
            onPress={handleToggleNetwork}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Billing Entitlements</CardTitle>
          <CardDescription testID="devtools-pro-status">
            {hasPro ? 'Entitlements: pro (Active)' : 'Entitlements: none (Free tier)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            testID="devtools-toggle-pro-button"
            variant="outline"
            label={hasPro ? 'Reset to Free Tier' : 'Simulate Pro Unlock'}
            onPress={handleTogglePro}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Feature Flag Overrides</CardTitle>
          <CardDescription>
            Toggle runtime flags resolved by FeatureFlagProvider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <View className="gap-3">
            {BOOLEAN_FLAGS.map(flagKey => (
              <Checkbox
                key={flagKey}
                testID={`devtools-flag-${flagKey}`}
                checked={Boolean(flags[flagKey])}
                onChange={checked => handleToggleFlag(flagKey, checked)}
                label={flagKey}
                accessibilityLabel={flagKey}
              />
            ))}
          </View>
        </CardContent>
      </Card>

      <Divider className="my-6" />

      <Link href="/settings" asChild>
        <Button testID="devtools-back-settings" variant="outline" label="Back to Settings" />
      </Link>
    </Screen>
  );
}
