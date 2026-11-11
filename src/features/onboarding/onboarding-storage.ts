import { getItem, removeItem, setItem } from '@/lib/storage';

export const ONBOARDING_STORAGE_KEY = 'swapstack.onboarding.seen';

export type OnboardingStep = {
  readonly id: string;
  readonly badge: string;
  readonly title: string;
  readonly description: string;
};

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: 'contracts',
    badge: 'Step 1 of 3',
    title: 'Vendor-agnostic foundation',
    description:
      'Every screen talks to plain TypeScript interfaces for authentication, user data, storage, notifications, and billing.',
  },
  {
    id: 'mocks',
    badge: 'Step 2 of 3',
    title: 'Zero API keys required locally',
    description:
      'Develop and test offline against deterministic in-memory mock providers from day one.',
  },
  {
    id: 'swap',
    badge: 'Step 3 of 3',
    title: 'Swap providers via .env',
    description:
      'Switch to Supabase and RevenueCat in production without rewriting a single screen component.',
  },
];

let inMemorySeen = false;

export function hasSeenOnboarding(): boolean {
  const stored = getItem<boolean>(ONBOARDING_STORAGE_KEY);
  return stored === true || inMemorySeen;
}

export function markOnboardingSeen(): void {
  inMemorySeen = true;
  setItem<boolean>(ONBOARDING_STORAGE_KEY, true);
}

export function resetOnboardingSeen(): void {
  inMemorySeen = false;
  removeItem(ONBOARDING_STORAGE_KEY);
}
