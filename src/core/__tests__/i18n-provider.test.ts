import { describeI18nProviderContract } from '../contracts';
import { MockI18nProvider } from '../mocks';

describeI18nProviderContract('MockI18nProvider', () => new MockI18nProvider());
