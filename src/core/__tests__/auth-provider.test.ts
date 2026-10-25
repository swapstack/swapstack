import { describeAuthProviderContract } from '../contracts/auth-provider.contract';
import { MockAuthProvider } from '../mocks/mock-auth-provider';

describe('mockAuthProvider Contract Suite', () => {
  describeAuthProviderContract(() => new MockAuthProvider());
});
