import type { I18nProvider } from '../i18n';

export function describeI18nProviderContract(
  label: string,
  createProvider: () => I18nProvider | Promise<I18nProvider>,
): void {
  describe(`I18nProvider contract (${label})`, () => {
    it('returns default locale, translates keys with interpolation, and switches locales', async () => {
      const provider = await createProvider();
      expect(provider.getLocale()).toBe('en');
      expect(provider.isRtl()).toBe(false);
      expect(provider.t('common.welcome', { name: 'Ada' })).toContain('Ada');

      const notified: string[] = [];
      const unsubscribe = provider.onLocaleChange(loc => notified.push(loc));

      await provider.setLocale('es');
      expect(provider.getLocale()).toBe('es');
      expect(provider.t('settings.title')).toBe('Configuración');
      expect(notified).toEqual(['es']);

      await provider.setLocale('ar');
      expect(provider.isRtl()).toBe(true);

      unsubscribe();
      await provider.setLocale('en');
      expect(notified).toEqual(['es', 'ar']);
    });

    it('lists available locales and falls back gracefully on unknown keys', async () => {
      const provider = await createProvider();
      const locales = provider.getAvailableLocales();
      expect(locales.length).toBeGreaterThanOrEqual(2);
      expect(provider.t('missing.translation.key')).toBe('missing.translation.key');
    });
  });
}
