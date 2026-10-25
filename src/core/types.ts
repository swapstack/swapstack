/**
 * Plain shared user model.
 */
export type User = {
  readonly id: string;
  readonly email: string;
  readonly createdAt?: string;
  readonly metadata?: Record<string, unknown>;
};

/**
 * Plain shared session model.
 */
export type Session = {
  readonly token: string;
  readonly user: User;
  readonly expiresAt?: number;
};

/**
 * Plain shared profile model.
 */
export type Profile = {
  readonly id: string;
  readonly email?: string;
  readonly displayName?: string;
  readonly avatarUrl?: string;
  readonly updatedAt?: string;
  readonly [key: string]: unknown;
};

/**
 * Plain shared entitlement model.
 * Entitlements represent privileges/access granted to a user, not store SKUs.
 */
export type Entitlement = {
  readonly id: string;
  readonly isActive: boolean;
  readonly expirationDate?: string | null;
};

/**
 * Plain shared offering model.
 * Offerings map what can be presented for purchase to an entitlement.
 */
export type Offering = {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly price: string;
  readonly entitlementId: string;
};

export type Unsubscribe = () => void;
