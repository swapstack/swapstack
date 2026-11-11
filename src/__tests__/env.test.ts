import { validateStrictEnv } from '../../env';

function setExpoEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  }
  else {
    process.env[key] = value;
  }

  try {
    const virtual = require('expo/virtual/env') as { env: Record<string, string | undefined> };
    if (value === undefined) {
      delete virtual.env[key];
    }
    else {
      virtual.env[key] = value;
    }
  }
  catch {
    // Expo virtual env not present outside babel-preset-expo
  }
}

describe('validateStrictEnv', () => {
  const trackedKeys = [
    'EXPO_PUBLIC_AUTH_PROVIDER',
    'EXPO_PUBLIC_DATA_PROVIDER',
    'EXPO_PUBLIC_STORAGE_PROVIDER',
    'EXPO_PUBLIC_BILLING_PROVIDER',
    'EXPO_PUBLIC_ANALYTICS_PROVIDER',
    'EXPO_PUBLIC_FEATURE_FLAGS_PROVIDER',
    'EXPO_PUBLIC_AI_PROVIDER',
    'EXPO_PUBLIC_ERROR_REPORTER_PROVIDER',
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY',
    'EXPO_PUBLIC_POSTHOG_API_KEY',
    'EXPO_PUBLIC_OPENAI_API_KEY',
    'EXPO_PUBLIC_SENTRY_DSN',
  ];

  beforeEach(() => {
    for (const key of trackedKeys) {
      setExpoEnv(key, undefined);
    }
  });

  afterAll(() => {
    for (const key of trackedKeys) {
      setExpoEnv(key, undefined);
    }
  });

  it('passes when all providers are mock and no keys are configured', () => {
    setExpoEnv('EXPO_PUBLIC_AUTH_PROVIDER', 'mock');
    setExpoEnv('EXPO_PUBLIC_DATA_PROVIDER', 'mock');
    setExpoEnv('EXPO_PUBLIC_STORAGE_PROVIDER', 'mock');
    setExpoEnv('EXPO_PUBLIC_BILLING_PROVIDER', 'mock');
    setExpoEnv('EXPO_PUBLIC_ANALYTICS_PROVIDER', 'mock');
    setExpoEnv('EXPO_PUBLIC_FEATURE_FLAGS_PROVIDER', 'mock');
    setExpoEnv('EXPO_PUBLIC_AI_PROVIDER', 'mock');
    setExpoEnv('EXPO_PUBLIC_ERROR_REPORTER_PROVIDER', 'mock');

    expect(() => validateStrictEnv()).not.toThrow();
  });

  it('validates Supabase requirements', () => {
    setExpoEnv('EXPO_PUBLIC_AUTH_PROVIDER', 'supabase');
    expect(() => validateStrictEnv()).toThrow(/EXPO_PUBLIC_SUPABASE_URL/);

    setExpoEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://demo.supabase.co');
    setExpoEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    expect(() => validateStrictEnv()).not.toThrow();
  });

  it('validates Firebase requirements', () => {
    setExpoEnv('EXPO_PUBLIC_AUTH_PROVIDER', 'firebase');
    expect(() => validateStrictEnv()).toThrow(/EXPO_PUBLIC_FIREBASE_API_KEY/);

    setExpoEnv('EXPO_PUBLIC_FIREBASE_API_KEY', 'fb-key');
    setExpoEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'fb-project');
    expect(() => validateStrictEnv()).not.toThrow();
  });

  it('validates Clerk requirements', () => {
    setExpoEnv('EXPO_PUBLIC_AUTH_PROVIDER', 'clerk');
    expect(() => validateStrictEnv()).toThrow(/EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY/);

    setExpoEnv('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY', 'pk_test_123');
    expect(() => validateStrictEnv()).not.toThrow();
  });

  it('validates RevenueCat requirements', () => {
    setExpoEnv('EXPO_PUBLIC_BILLING_PROVIDER', 'revenuecat');
    expect(() => validateStrictEnv()).toThrow(/EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY/);

    setExpoEnv('EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY', 'appl_123');
    expect(() => validateStrictEnv()).not.toThrow();
  });

  it('validates PostHog requirements', () => {
    setExpoEnv('EXPO_PUBLIC_ANALYTICS_PROVIDER', 'posthog');
    expect(() => validateStrictEnv()).toThrow(/EXPO_PUBLIC_POSTHOG_API_KEY/);

    setExpoEnv('EXPO_PUBLIC_POSTHOG_API_KEY', 'phc_123');
    expect(() => validateStrictEnv()).not.toThrow();
  });

  it('validates OpenAI requirements', () => {
    setExpoEnv('EXPO_PUBLIC_AI_PROVIDER', 'openai');
    expect(() => validateStrictEnv()).toThrow(/EXPO_PUBLIC_OPENAI_API_KEY/);

    setExpoEnv('EXPO_PUBLIC_OPENAI_API_KEY', 'sk-123');
    expect(() => validateStrictEnv()).not.toThrow();
  });

  it('validates Sentry requirements', () => {
    setExpoEnv('EXPO_PUBLIC_ERROR_REPORTER_PROVIDER', 'sentry');
    expect(() => validateStrictEnv()).toThrow(/EXPO_PUBLIC_SENTRY_DSN/);

    setExpoEnv('EXPO_PUBLIC_SENTRY_DSN', 'https://test@sentry.io/1');
    expect(() => validateStrictEnv()).not.toThrow();
  });
});
