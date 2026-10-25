import { AuthError, BillingError } from '../errors';

describe('error classes', () => {
  it('creates AuthError with message and code', () => {
    const error = new AuthError('User already registered', 'user_already_exists');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AuthError);
    expect(error.name).toBe('AuthError');
    expect(error.message).toBe('User already registered');
    expect(error.code).toBe('user_already_exists');
  });

  it('defaults AuthError code to unknown', () => {
    const error = new AuthError('Something went wrong');
    expect(error.code).toBe('unknown');
  });

  it('creates BillingError with message and cancelled code', () => {
    const error = new BillingError('User dismissed payment dialog', 'cancelled');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BillingError);
    expect(error.name).toBe('BillingError');
    expect(error.message).toBe('User dismissed payment dialog');
    expect(error.code).toBe('cancelled');
  });

  it('defaults BillingError code to unknown', () => {
    const error = new BillingError('Purchase failed');
    expect(error.code).toBe('unknown');
  });
});
