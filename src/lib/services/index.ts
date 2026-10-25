export type BackendAdapter = {
  readonly name: string;
  readonly mode: 'live' | 'mock';
};

export type BillingAdapter = {
  readonly name: string;
  readonly mode: 'live' | 'mock';
};

const mockBackend: BackendAdapter = {
  name: 'Supabase',
  mode: 'mock',
};

const mockBilling: BillingAdapter = {
  name: 'RevenueCat',
  mode: 'mock',
};

export const serviceProviders = {
  backend: mockBackend,
  billing: mockBilling,
};
