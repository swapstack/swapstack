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
function validateStrictEnv(): void {
  const errors: string[] = [];

  const authProvider = process.env.EXPO_PUBLIC_AUTH_PROVIDER?.trim().toLowerCase() || 'mock';
  const dataProvider = process.env.EXPO_PUBLIC_DATA_PROVIDER?.trim().toLowerCase() || 'mock';

  if (authProvider === 'supabase' || dataProvider === 'supabase') {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!supabaseUrl || !supabaseAnonKey) {
      errors.push(
        'The Supabase provider is selected but EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing.',
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

if (process.env.STRICT_ENV_VALIDATION) {
  validateStrictEnv();
}

export default Env;
