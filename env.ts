import z from 'zod';

import packageJSON from './package.json';

const DEFAULT_APP_IDENTITY = {
  APP_NAME: 'Swapstack',
  APP_SLUG: 'swapstack',
  APP_SCHEME: 'swapstack',
  IOS_BUNDLE_ID: 'com.swapstack.app',
  ANDROID_PACKAGE: 'com.swapstack.app',
} as const;

const envSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'preview', 'production']),
  EXPO_PUBLIC_VERSION: z.string(),
  APP_NAME: z.string().min(1),
  APP_SLUG: z.string().min(1),
  APP_SCHEME: z.string().min(1),
  IOS_BUNDLE_ID: z.string().min(1),
  ANDROID_PACKAGE: z.string().min(1),
});

const EXPO_PUBLIC_APP_ENV = (process.env.EXPO_PUBLIC_APP_ENV
  ?? 'development') as z.infer<typeof envSchema>['EXPO_PUBLIC_APP_ENV'];
const STRICT_ENV_VALIDATION = process.env.STRICT_ENV_VALIDATION === '1';

const _env: z.infer<typeof envSchema> = {
  EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_VERSION: packageJSON.version,
  APP_NAME: process.env.APP_NAME ?? DEFAULT_APP_IDENTITY.APP_NAME,
  APP_SLUG: process.env.APP_SLUG ?? DEFAULT_APP_IDENTITY.APP_SLUG,
  APP_SCHEME: process.env.APP_SCHEME ?? DEFAULT_APP_IDENTITY.APP_SCHEME,
  IOS_BUNDLE_ID: process.env.IOS_BUNDLE_ID ?? DEFAULT_APP_IDENTITY.IOS_BUNDLE_ID,
  ANDROID_PACKAGE: process.env.ANDROID_PACKAGE ?? DEFAULT_APP_IDENTITY.ANDROID_PACKAGE,
};

function getValidatedEnv(env: z.infer<typeof envSchema>) {
  const parsed = envSchema.safeParse(env);

  if (parsed.success === false) {
    const errorMessage
      = `Invalid environment variables: ${
        JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
      }\nCheck .env for APP_ENV=${EXPO_PUBLIC_APP_ENV}.`;

    if (STRICT_ENV_VALIDATION) {
      console.error(errorMessage);
      throw new Error('Invalid environment variables');
    }
  }

  return parsed.success ? parsed.data : env;
}

const Env = STRICT_ENV_VALIDATION ? getValidatedEnv(_env) : _env;

export default Env;
