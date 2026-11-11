import { Link } from 'expo-router';
import * as React from 'react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Text,
  View,
} from '@/components/ui';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { FormMessage } from '@/features/auth/components/form-message';
import { useAuthSession } from '@/features/auth/session';
import { getErrorMessage } from '@/features/auth/validation';
import {
  markOnboardingSeen,
  ONBOARDING_STEPS,
} from '@/features/onboarding/onboarding-storage';
import { serviceProviders } from '@/lib/services';

export default function OnboardingScreen() {
  const { auth } = useAuthSession();
  const [stepIndex, setStepIndex] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const step = ONBOARDING_STEPS[stepIndex] ?? ONBOARDING_STEPS[0];
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  const handleContinueAsGuest = React.useCallback(async () => {
    if (isSubmitting) {
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      markOnboardingSeen();
      await serviceProviders.analytics.track('onboarding_completed', {
        method: 'guest',
      });
      await auth.signInAnonymously();
    }
    catch (cause) {
      setError(getErrorMessage(cause));
    }
    finally {
      setIsSubmitting(false);
    }
  }, [auth, isSubmitting]);

  return (
    <AuthScreen
      title="Welcome"
      description="Explore how your app is structured before signing in."
    >
      <Card testID="onboarding-step-card" className="mb-6">
        <CardContent>
          <Text
            testID="onboarding-step-badge"
            className="mb-2 font-semibold text-xs text-neutral-500 dark:text-neutral-400"
          >
            {step.badge}
          </Text>
          <CardTitle testID="onboarding-step-title">{step.title}</CardTitle>
          <CardDescription testID="onboarding-step-description" className="mt-2">
            {step.description}
          </CardDescription>
        </CardContent>
      </Card>

      {error && <FormMessage kind="error">{error}</FormMessage>}

      <View className="flex-row gap-3">
        {stepIndex > 0 && (
          <View className="flex-1">
            <Button
              testID="onboarding-back-button"
              variant="outline"
              label="Back"
              disabled={isSubmitting}
              onPress={() => setStepIndex(i => Math.max(0, i - 1))}
            />
          </View>
        )}
        {!isLastStep && (
          <View className="flex-1">
            <Button
              testID="onboarding-next-button"
              label="Next"
              disabled={isSubmitting}
              onPress={() => setStepIndex(i => Math.min(ONBOARDING_STEPS.length - 1, i + 1))}
            />
          </View>
        )}
      </View>

      <Button
        testID="onboarding-guest-button"
        variant={isLastStep ? 'default' : 'outline'}
        label="Continue without account"
        loading={isSubmitting}
        disabled={isSubmitting}
        onPress={handleContinueAsGuest}
      />

      <Link
        href="/login"
        asChild
        onPress={() => {
          markOnboardingSeen();
          void serviceProviders.analytics.track('onboarding_completed', {
            method: 'login',
          });
        }}
      >
        <Button
          testID="onboarding-login-button"
          variant="ghost"
          label="Sign in with email"
          disabled={isSubmitting}
        />
      </Link>
    </AuthScreen>
  );
}
