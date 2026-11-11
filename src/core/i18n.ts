import type { Unsubscribe } from './types';

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'ar';

export type LocaleInfo = {
  readonly code: SupportedLocale;
  readonly label: string;
  readonly isRtl: boolean;
};

export type TranslationParams = Record<string, string | number>;

export type I18nProvider = {
  readonly mode?: 'mock' | 'live';
  readonly getLocale: () => SupportedLocale;
  readonly setLocale: (locale: SupportedLocale) => Promise<void>;
  readonly getAvailableLocales: () => readonly LocaleInfo[];
  readonly isRtl: () => boolean;
  readonly t: (key: string, params?: TranslationParams) => string;
  readonly onLocaleChange: (callback: (locale: SupportedLocale) => void) => Unsubscribe;
};
