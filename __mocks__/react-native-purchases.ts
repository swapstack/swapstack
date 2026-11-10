export const Purchases = {
  configure: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  getCustomerInfo: jest.fn(),
  addCustomerInfoUpdateListener: jest.fn(),
  removeCustomerInfoUpdateListener: jest.fn(() => true),
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: '1',
  },
};
