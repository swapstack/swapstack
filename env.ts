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

export default Env;
