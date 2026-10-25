export type AuthErrorCode
  = | 'invalid_credentials'
    | 'user_not_found'
    | 'user_already_exists'
    | 'invalid_email'
    | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(message: string, code: AuthErrorCode = 'unknown') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export type BillingErrorCode
  = | 'cancelled'
    | 'offering_not_found'
    | 'purchase_failed'
    | 'unknown';

export class BillingError extends Error {
  readonly code: BillingErrorCode;

  constructor(message: string, code: BillingErrorCode = 'unknown') {
    super(message);
    this.name = 'BillingError';
    this.code = code;
  }
}
