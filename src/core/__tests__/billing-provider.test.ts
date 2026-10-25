import { describeBillingProviderContract } from '../contracts/billing-provider.contract';
import { MockBillingProvider } from '../mocks/mock-billing-provider';

describe('mockBillingProvider Contract Suite', () => {
  describeBillingProviderContract(() => new MockBillingProvider());
});
