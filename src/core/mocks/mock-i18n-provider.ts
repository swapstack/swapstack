import type {
  I18nProvider,
  LocaleInfo,
  SupportedLocale,
  TranslationParams,
} from '../i18n';
import type { Unsubscribe } from '../types';

export const DEFAULT_LOCALES: readonly LocaleInfo[] = [
  { code: 'en', label: 'English', isRtl: false },
  { code: 'es', label: 'Español', isRtl: false },
  { code: 'fr', label: 'Français', isRtl: false },
  { code: 'de', label: 'Deutsch', isRtl: false },
  { code: 'ar', label: 'العربية', isRtl: true },
] as const;

export const DEFAULT_TRANSLATIONS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    'common.welcome': 'Welcome back, {{name}}!',
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'paywall.upgrade': 'Upgrade to Pro',
  },
  es: {
    'common.welcome': '¡Bienvenido de nuevo, {{name}}!',
    'settings.title': 'Configuración',
    'settings.language': 'Idioma',
    'paywall.upgrade': 'Actualizar a Pro',
  },
  fr: {
    'common.welcome': 'Bon retour, {{name}} !',
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'paywall.upgrade': 'Passer à Pro',
  },
  de: {
    'common.welcome': 'Willkommen zurück, {{name}}!',
    'settings.title': 'Einstellungen',
    'settings.language': 'Sprache',
    'paywall.upgrade': 'Auf Pro upgraden',
  },
  ar: {
    'common.welcome': 'مرحباً بعودتك، {{name}}!',
    'settings.title': 'الإعدادات',
    'settings.language': 'اللغة',
    'paywall.upgrade': 'الترقية إلى برو',
  },
};

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = params[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

export class MockI18nProvider implements I18nProvider {
  public readonly mode = 'mock' as const;
  private locale: SupportedLocale;
  private readonly dictionaries: Record<SupportedLocale, Record<string, string>>;
  private readonly listeners = new Set<(locale: SupportedLocale) => void>();

  public constructor(
    initialLocale: SupportedLocale = 'en',
    customDictionaries?: Partial<Record<SupportedLocale, Record<string, string>>>,
  ) {
    this.locale = initialLocale;
    this.dictionaries = {
      en: { ...DEFAULT_TRANSLATIONS.en, ...customDictionaries?.en },
      es: { ...DEFAULT_TRANSLATIONS.es, ...customDictionaries?.es },
      fr: { ...DEFAULT_TRANSLATIONS.fr, ...customDictionaries?.fr },
      de: { ...DEFAULT_TRANSLATIONS.de, ...customDictionaries?.de },
      ar: { ...DEFAULT_TRANSLATIONS.ar, ...customDictionaries?.ar },
    };
  }

  public getLocale(): SupportedLocale {
    return this.locale;
  }

  public async setLocale(locale: SupportedLocale): Promise<void> {
    const valid = DEFAULT_LOCALES.some(item => item.code === locale);
    if (!valid) {
      throw new Error(`Unsupported locale "${locale}".`);
    }
    this.locale = locale;
    for (const listener of this.listeners) {
      listener(locale);
    }
  }

  public getAvailableLocales(): readonly LocaleInfo[] {
    return DEFAULT_LOCALES;
  }

  public isRtl(): boolean {
    return DEFAULT_LOCALES.find(item => item.code === this.locale)?.isRtl ?? false;
  }

  public t(key: string, params?: TranslationParams): string {
    const currentDict = this.dictionaries[this.locale];
    const fallbackDict = this.dictionaries.en;
    const template = currentDict[key] ?? fallbackDict[key] ?? key;
    return interpolate(template, params);
  }

  public onLocaleChange(callback: (locale: SupportedLocale) => void): Unsubscribe {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public reset(): void {
    this.locale = 'en';
    this.listeners.clear();
  }
}
