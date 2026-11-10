import * as React from 'react';

import { Button, Card, CardContent, CardDescription, CardTitle, Text, View } from '@/components/ui';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { FormMessage } from '@/features/auth/components/form-message';
import { serviceProviders } from '@/lib/services';

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function PaywallScreen() {
  const billing = serviceProviders.billing;
  const [offerings, setOfferings] = React.useState<Awaited<ReturnType<typeof billing.getOfferings>>>([]);
  const [entitlements, setEntitlements] = React.useState<Awaited<ReturnType<typeof billing.getEntitlements>>>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [purchasingId, setPurchasingId] = React.useState<string>();
  const [error, setError] = React.useState<string>();

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const [nextOfferings, nextEntitlements] = await Promise.all([
        billing.getOfferings(),
        billing.getEntitlements(),
      ]);
      setOfferings(nextOfferings);
      setEntitlements(nextEntitlements);
    }
    catch (cause) {
      setError(getMessage(cause));
    }
    finally {
      setIsLoading(false);
    }
  }, [billing]);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      if (active) {
        await refresh();
      }
    };
    void load();

    const unsubscribe = billing.onEntitlementsChange((next) => {
      if (active) {
        setEntitlements(next);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [billing, refresh]);

  const activeEntitlements = entitlements.filter(entitlement => entitlement.isActive);
  const purchase = React.useCallback(async (offeringId: string) => {
    setPurchasingId(offeringId);
    setError(undefined);
    try {
      setEntitlements(await billing.purchase(offeringId));
    }
    catch (cause) {
      setError(getMessage(cause));
    }
    finally {
      setPurchasingId(undefined);
    }
  }, [billing]);

  const restore = React.useCallback(async () => {
    setIsRestoring(true);
    setError(undefined);
    try {
      setEntitlements(await billing.restore());
    }
    catch (cause) {
      setError(getMessage(cause));
    }
    finally {
      setIsRestoring(false);
    }
  }, [billing]);

  return (
    <AuthScreen title="Choose a plan" description="Unlock premium features with a subscription.">
      {isLoading
        ? <Text className="text-muted-foreground">Loading plans…</Text>
        : (
            <>
              {error && <FormMessage kind="error">{error}</FormMessage>}
              {activeEntitlements.length > 0 && (
                <Card className="mb-4">
                  <CardTitle>Subscription active</CardTitle>
                  <CardDescription>
                    {`Active entitlements: ${activeEntitlements.map(entitlement => entitlement.id).join(', ')}`}
                  </CardDescription>
                </Card>
              )}

              <View className="gap-4">
                {offerings.map(offering => (
                  <Card key={offering.id}>
                    <CardTitle>{offering.title}</CardTitle>
                    {offering.description && <CardDescription>{offering.description}</CardDescription>}
                    <CardContent>
                      <View className="mt-2 flex-row items-center justify-between">
                        <Text className="font-semibold text-lg">{offering.price}</Text>
                        <Button
                          testID={`purchase-${offering.id}`}
                          label={purchasingId === offering.id ? 'Purchasing…' : 'Purchase'}
                          loading={purchasingId === offering.id}
                          disabled={Boolean(purchasingId) || isRestoring}
                          onPress={() => purchase(offering.id)}
                        />
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </View>

              <Button
                testID="restore-purchases-button"
                className="mt-6"
                variant="outline"
                label="Restore purchases"
                loading={isRestoring}
                disabled={Boolean(purchasingId)}
                onPress={restore}
              />
            </>
          )}
    </AuthScreen>
  );
}
