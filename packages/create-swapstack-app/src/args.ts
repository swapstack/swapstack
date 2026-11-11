import type { StylePreset, ThemePreset } from './themes.js';
import { STYLE_PRESETS, THEME_PRESETS, validateStylePreset, validateThemePreset } from './themes.js';

export const AUTH_PROVIDERS = ['mock', 'supabase', 'firebase', 'clerk'] as const;
export type AuthProviderOption = typeof AUTH_PROVIDERS[number];

export const DATA_PROVIDERS = ['mock', 'supabase', 'firebase'] as const;
export type DataProviderOption = typeof DATA_PROVIDERS[number];

export const BILLING_PROVIDERS = ['mock', 'revenuecat'] as const;
export type BillingProviderOption = typeof BILLING_PROVIDERS[number];

export function validateAuthProvider(value: string): value is AuthProviderOption {
  return (AUTH_PROVIDERS as readonly string[]).includes(value);
}

export function validateDataProvider(value: string): value is DataProviderOption {
  return (DATA_PROVIDERS as readonly string[]).includes(value);
}

export function validateBillingProvider(value: string): value is BillingProviderOption {
  return (BILLING_PROVIDERS as readonly string[]).includes(value);
}

export type ParsedArgs = {
  targetDir?: string;
  name?: string;
  iosBundleId?: string;
  androidPackage?: string;
  theme?: ThemePreset;
  style?: StylePreset;
  authProvider?: AuthProviderOption;
  dataProvider?: DataProviderOption;
  billingProvider?: BillingProviderOption;
  ui: boolean;
  install: boolean;
  git: boolean;
  yes: boolean;
  help: boolean;
  version: boolean;
};

function getOptionValue(
  args: string[],
  index: number,
  flag: string,
): { value: string; nextIndex: number } {
  const arg = args[index];
  const eqIndex = arg.indexOf('=');

  if (eqIndex !== -1) {
    const val = arg.slice(eqIndex + 1);
    if (!val) {
      throw new Error(`Missing value for flag: ${arg.slice(0, eqIndex)}`);
    }
    return { value: val, nextIndex: index };
  }

  if (index + 1 >= args.length || args[index + 1].startsWith('-')) {
    throw new Error(`Missing value for flag: ${flag}`);
  }

  return { value: args[index + 1], nextIndex: index + 1 };
}

export function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    ui: false,
    install: true,
    git: true,
    yes: false,
    help: false,
    version: false,
  };

  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    }
    else if (arg === '--version' || arg === '-v') {
      parsed.version = true;
    }
    else if (arg === '--yes' || arg === '-y') {
      parsed.yes = true;
    }
    else if (arg === '--ui') {
      parsed.ui = true;
    }
    else if (arg === '--no-install') {
      parsed.install = false;
    }
    else if (arg === '--install') {
      parsed.install = true;
    }
    else if (arg === '--no-git') {
      parsed.git = false;
    }
    else if (arg === '--git') {
      parsed.git = true;
    }
    else if (arg === '--name' || arg.startsWith('--name=')) {
      const res = getOptionValue(args, i, arg);
      parsed.name = res.value;
      i = res.nextIndex;
    }
    else if (
      arg === '--bundle-id'
      || arg === '--bundleId'
      || arg.startsWith('--bundle-id=')
      || arg.startsWith('--bundleId=')
    ) {
      const res = getOptionValue(args, i, arg);
      parsed.iosBundleId = res.value;
      parsed.androidPackage = res.value;
      i = res.nextIndex;
    }
    else if (
      arg === '--ios-bundle-id'
      || arg === '--iosBundleId'
      || arg.startsWith('--ios-bundle-id=')
      || arg.startsWith('--iosBundleId=')
    ) {
      const res = getOptionValue(args, i, arg);
      parsed.iosBundleId = res.value;
      i = res.nextIndex;
    }
    else if (
      arg === '--android-package'
      || arg === '--androidPackage'
      || arg.startsWith('--android-package=')
      || arg.startsWith('--androidPackage=')
    ) {
      const res = getOptionValue(args, i, arg);
      parsed.androidPackage = res.value;
      i = res.nextIndex;
    }
    else if (arg === '--theme' || arg.startsWith('--theme=')) {
      const res = getOptionValue(args, i, arg);
      const val = res.value.toLowerCase();
      if (!validateThemePreset(val)) {
        throw new Error(
          `Invalid --theme "${res.value}". Valid options: ${THEME_PRESETS.join(', ')}`,
        );
      }
      parsed.theme = val;
      i = res.nextIndex;
    }
    else if (arg === '--style' || arg.startsWith('--style=')) {
      const res = getOptionValue(args, i, arg);
      const val = res.value.toLowerCase();
      if (!validateStylePreset(val)) {
        throw new Error(
          `Invalid --style "${res.value}". Valid options: ${STYLE_PRESETS.join(', ')}`,
        );
      }
      parsed.style = val;
      i = res.nextIndex;
    }
    else if (arg === '--auth' || arg.startsWith('--auth=')) {
      const res = getOptionValue(args, i, arg);
      const val = res.value.toLowerCase();
      if (!validateAuthProvider(val)) {
        throw new Error(
          `Invalid --auth "${res.value}". Valid options: ${AUTH_PROVIDERS.join(', ')}`,
        );
      }
      parsed.authProvider = val;
      i = res.nextIndex;
    }
    else if (arg === '--data' || arg.startsWith('--data=')) {
      const res = getOptionValue(args, i, arg);
      const val = res.value.toLowerCase();
      if (!validateDataProvider(val)) {
        throw new Error(
          `Invalid --data "${res.value}". Valid options: ${DATA_PROVIDERS.join(', ')}`,
        );
      }
      parsed.dataProvider = val;
      i = res.nextIndex;
    }
    else if (arg === '--billing' || arg.startsWith('--billing=')) {
      const res = getOptionValue(args, i, arg);
      const val = res.value.toLowerCase();
      if (!validateBillingProvider(val)) {
        throw new Error(
          `Invalid --billing "${res.value}". Valid options: ${BILLING_PROVIDERS.join(', ')}`,
        );
      }
      parsed.billingProvider = val;
      i = res.nextIndex;
    }
    else if (arg.startsWith('-')) {
      throw new Error(`Unknown flag: ${arg}`);
    }
    else {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    parsed.targetDir = positional[0];
  }

  return parsed;
}
