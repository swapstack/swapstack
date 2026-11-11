import packageJSON from './package.json';

type AppEnvironment = 'development' | 'preview' | 'production';

type AppConfig = {
  EXPO_PUBLIC_APP_ENV: AppEnvironment;
  EXPO_PUBLIC_VERSION: string;
  APP_NAME: string;
  APP_SLUG: string;
  APP_SCHEME: string;
  IOS_BUNDLE_ID: string;
  ANDROID_PACKAGE: string;
};

const DEFAULT_APP_IDENTITY = {
  APP_NAME: 'Swapstack',
  APP_SLUG: 'swapstack',
  APP_SCHEME: 'swapstack',
  IOS_BUNDLE_ID: 'com.swapstack.app',
  ANDROID_PACKAGE: 'com.swapstack.app',
} as const;

const Env: AppConfig = {
  EXPO_PUBLIC_APP_ENV: (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') as AppEnvironment,
  EXPO_PUBLIC_VERSION: packageJSON.version,
  APP_NAME: process.env.APP_NAME ?? DEFAULT_APP_IDENTITY.APP_NAME,
  APP_SLUG: process.env.APP_SLUG ?? DEFAULT_APP_IDENTITY.APP_SLUG,
  APP_SCHEME: process.env.APP_SCHEME ?? DEFAULT_APP_IDENTITY.APP_SCHEME,
  IOS_BUNDLE_ID: process.env.IOS_BUNDLE_ID ?? DEFAULT_APP_IDENTITY.IOS_BUNDLE_ID,
  ANDROID_PACKAGE: process.env.ANDROID_PACKAGE ?? DEFAULT_APP_IDENTITY.ANDROID_PACKAGE,
};

// When STRICT_ENV_VALIDATION is set (used by the `prebuild:*` scripts), fail the
// build early on an incoherent provider configuration, rather than discovering it
// only once the app boots. This mirrors the build-time half of the runtime
// `validateProviderConfig()` in `src/lib/providers`; it intentionally does not
// require any credentials for the default mock providers.
export function validateStrictEnv(): void {
  const errors: string[] = [];

  const authProvider = process.env.EXPO_PUBLIC_AUTH_PROVIDER?.trim().toLowerCase() || 'mock';
  const dataProvider = process.env.EXPO_PUBLIC_DATA_PROVIDER?.trim().toLowerCase() || 'mock';
  const storageProvider = process.env.EXPO_PUBLIC_STORAGE_PROVIDER?.trim().toLowerCase() || 'mock';
  const billingProvider = process.env.EXPO_PUBLIC_BILLING_PROVIDER?.trim().toLowerCase() || 'mock';
  const analyticsProvider = process.env.EXPO_PUBLIC_ANALYTICS_PROVIDER?.trim().toLowerCase() || 'mock';
  const featureFlagsProvider = process.env.EXPO_PUBLIC_FEATURE_FLAGS_PROVIDER?.trim().toLowerCase() || 'mock';
  const aiProvider = process.env.EXPO_PUBLIC_AI_PROVIDER?.trim().toLowerCase() || 'mock';
  const errorReporterProvider = process.env.EXPO_PUBLIC_ERROR_REPORTER_PROVIDER?.trim().toLowerCase() || 'mock';

  if (authProvider === 'supabase' || dataProvider === 'supabase' || storageProvider === 'supabase') {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!supabaseUrl || !supabaseAnonKey) {
      errors.push(
        'The Supabase provider is selected but EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing.',
      );
    }
  }

  if (authProvider === 'firebase' || dataProvider === 'firebase' || storageProvider === 'firebase') {
    const firebaseKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();
    const firebaseProjectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    if (!firebaseKey || !firebaseProjectId) {
      errors.push(
        'The Firebase provider is selected but EXPO_PUBLIC_FIREBASE_API_KEY or EXPO_PUBLIC_FIREBASE_PROJECT_ID is missing.',
      );
    }
  }

  if (authProvider === 'clerk' && !process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()) {
    errors.push('The Clerk provider is selected but EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing.');
  }

  if (billingProvider === 'revenuecat' && !process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY?.trim()) {
    errors.push('The RevenueCat provider is selected but EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY is missing.');
  }

  if (
    (analyticsProvider === 'posthog' || featureFlagsProvider === 'posthog')
    && !process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim()
  ) {
    errors.push('The PostHog provider is selected but EXPO_PUBLIC_POSTHOG_API_KEY is missing.');
  }

  if (aiProvider === 'openai' && !process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim()) {
    errors.push('The OpenAI provider is selected but EXPO_PUBLIC_OPENAI_API_KEY is missing.');
  }

  if (errorReporterProvider === 'sentry' && !process.env.EXPO_PUBLIC_SENTRY_DSN?.trim()) {
    errors.push('The Sentry provider is selected but EXPO_PUBLIC_SENTRY_DSN is missing.');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

if (process.env.STRICT_ENV_VALIDATION) {
  validateStrictEnv();
}

export default Env;
