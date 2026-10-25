import {
  describeBillingPurchaseContract,
  describeBillingReadOnlyContract,
} from '../contracts/billing-provider.contract';
import { MockBillingProvider } from '../mocks/mock-billing-provider';

describe('mock billing provider contracts', () => {
  describeBillingReadOnlyContract(() => new MockBillingProvider());
  describeBillingPurchaseContract(() => new MockBillingProvider());
});

describe('mock billing provider cancellation handling', () => {
  it('throws BillingError with cancelled code when purchase is cancelled', async () => {
    const provider = new MockBillingProvider();
    await expect(provider.purchase('cancelled')).rejects.toMatchObject({
      code: 'cancelled',
    });
  });
});
