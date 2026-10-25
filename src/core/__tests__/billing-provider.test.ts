import {
  describeBillingPurchaseContract,
  describeBillingReadOnlyContract,
} from '../contracts/billing-provider.contract';
import { MockBillingProvider } from '../mocks/mock-billing-provider';

describe('mock billing provider contracts', () => {
  describeBillingReadOnlyContract(() => new MockBillingProvider());
  describeBillingPurchaseContract(() => new MockBillingProvider());
});
