# Example App Blueprints

These four end-to-end blueprints show how to turn Swapstack into real mobile products across fitness, productivity, AI SaaS, and personal finance.

Every example follows Swapstack's golden rule: **screens talk only to plain TypeScript contracts in `src/core/`**, work out of the box with zero API keys using in-memory mocks (`EXPO_PUBLIC_*_PROVIDER=mock`), and can switch to live **Supabase** and **RevenueCat** adapters via `.env` without modifying a single screen.

---

## 1. Pulse — Habit & Workout Tracker

**Why it fits Swapstack:** Fitness and habit apps lose users if forced to sign up before logging their first workout. Pulse starts users immediately via `auth.signInAnonymously()`, lets them link an email/password later from `/profile` (`auth.linkAccount`), and gates advanced streak analytics behind the `pro` entitlement in `BillingProvider`.

### Scaffold Command

```sh
npx create-swapstack-app pulse --name "Pulse" --bundle-id com.acme.pulse --yes
cd pulse
```

### Core Contract (`src/core/workouts.ts`)

```ts
export type WorkoutEntry = {
  id: string;
  userId: string;
  title: string;
  durationMinutes: number;
  completedAt: string;
};

export type WorkoutStats = {
  totalWorkouts: number;
  currentStreakDays: number;
  totalMinutes: number;
};

export type WorkoutRepository = {
  readonly mode: 'mock' | 'live';
  list: (userId: string) => Promise<WorkoutEntry[]>;
  log: (userId: string, input: { title: string; durationMinutes: number }) => Promise<WorkoutEntry>;
  remove: (userId: string, workoutId: string) => Promise<void>;
  getStats: (userId: string) => Promise<WorkoutStats>;
};
```

### Copy-Paste AI Agent Prompt

```text
Build the "Pulse" Habit & Workout Tracker app in this Swapstack project following `AGENTS.md`:

1. Create `src/core/workouts.ts` with `WorkoutEntry`, `WorkoutStats`, and `WorkoutRepository` types (use `type` definitions, no vendor imports).
2. Create `src/core/mocks/mock-workout-repository.ts` implementing `WorkoutRepository` in memory with deterministic streak calculation and a `reset()` helper for tests.
3. Create `src/core/contracts/workout-repository.contract.ts` (`describeWorkoutRepositoryContract`) and run it in `src/core/__tests__/workout-repository.test.ts`.
4. Register `workouts` in `src/lib/providers/registry.ts` and expose `serviceProviders.workouts` in `src/lib/services/index.ts`.
5. Update `src/app/(app)/index.tsx` so users (including anonymous guests) can log workouts, view their workout history, and see a "Pro Streak Analytics" card that checks `serviceProviders.billing.getEntitlements()` for an active `pro` entitlement (linking to `/paywall` when locked).
6. Add React Native Testing Library tests in `src/app/(app)/__tests__/index.test.tsx` covering logging a workout and unlocking Pro analytics.
7. Run `pnpm run lint`, `pnpm run type-check`, and `pnpm test`.
```

---

## 2. MemoStack — Offline-First Notes & Flashcards

**Why it fits Swapstack:** Students and readers can create study decks immediately in guest mode, upgrade their guest account to sync decks with Supabase (`auth.linkAccount`), and unlock unlimited decks via the RevenueCat paywall (`/paywall`).

### Scaffold Command

```sh
npx create-swapstack-app memostack --name "MemoStack" --bundle-id com.acme.memostack --yes
cd memostack
```

### Core Contract (`src/core/decks.ts`)

```ts
export type Flashcard = {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
};

export type StudyDeck = {
  id: string;
  userId: string;
  title: string;
  cards: Flashcard[];
  updatedAt: string;
};

export type DeckRepository = {
  readonly mode: 'mock' | 'live';
  listDecks: (userId: string) => Promise<StudyDeck[]>;
  createDeck: (userId: string, title: string) => Promise<StudyDeck>;
  addCard: (userId: string, deckId: string, card: { front: string; back: string }) => Promise<StudyDeck>;
  toggleMastered: (userId: string, deckId: string, cardId: string) => Promise<StudyDeck>;
};
```

### Copy-Paste AI Agent Prompt

```text
Build the "MemoStack" Flashcards & Study Decks app in this Swapstack project following `AGENTS.md`:

1. Create `src/core/decks.ts` defining `Flashcard`, `StudyDeck`, and `DeckRepository` using plain `type` aliases.
2. Implement `MockDeckRepository` in `src/core/mocks/mock-deck-repository.ts` and verify it with a reusable `describeDeckRepositoryContract` suite in `src/core/contracts/deck-repository.contract.ts`.
3. Register `decks` in `src/lib/providers/registry.ts` and expose `serviceProviders.decks` in `src/lib/services/index.ts`.
4. Build the deck list and card study view in `src/app/(app)/index.tsx` using `@/components/ui` primitives (`Screen`, `Card`, `Input`, `Button`, `Checkbox`, `Text`).
5. Enforce a free-tier limit of 3 decks unless the user has an active `pro` entitlement from `serviceProviders.billing.getEntitlements()`, routing to `/paywall` when they exceed the free limit.
6. Write flow tests in `src/app/(app)/__tests__/index.test.tsx` verifying deck creation, card mastery toggling, and the 3-deck paywall gate.
7. Run `pnpm run lint`, `pnpm run type-check`, and `pnpm test`.
```

---

## 3. PromptBox — Subscription AI Assistant & Saved Threads

**Why it fits Swapstack:** AI companion and productivity apps need clean authentication, saved conversation history, and strict daily message quotas for free users with instant upgrade to `pro` via RevenueCat (`billing.onEntitlementsChange`).

### Scaffold Command

```sh
npx create-swapstack-app promptbox --name "PromptBox" --bundle-id com.acme.promptbox --yes
cd promptbox
```

### Core Contract (`src/core/assistant.ts`)

```ts
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type ChatThread = {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
};

export type AssistantProvider = {
  readonly mode: 'mock' | 'live';
  listThreads: (userId: string) => Promise<ChatThread[]>;
  sendMessage: (userId: string, input: { threadId?: string; prompt: string }) => Promise<ChatThread>;
  deleteThread: (userId: string, threadId: string) => Promise<void>;
};
```

### Copy-Paste AI Agent Prompt

```text
Build the "PromptBox" AI Assistant app in this Swapstack project following `AGENTS.md`:

1. Create `src/core/assistant.ts` with `ChatMessage`, `ChatThread`, and `AssistantProvider` types.
2. Implement `MockAssistantProvider` in `src/core/mocks/mock-assistant-provider.ts` returning deterministic assistant replies, and test it via `describeAssistantProviderContract` in `src/core/contracts/assistant-provider.contract.ts`.
3. Register `assistant` in `src/lib/providers/registry.ts` and expose `serviceProviders.assistant` in `src/lib/services/index.ts`.
4. Update `src/app/(app)/index.tsx` to let users send prompts, view saved threads, and track message count. Gate unlimited prompts behind the `pro` entitlement from `serviceProviders.billing`, showing an upgrade prompt to `/paywall` after 5 free messages.
5. Add tests in `src/app/(app)/__tests__/index.test.tsx` testing prompt submission, thread rendering, and the free-quota paywall banner.
6. Run `pnpm run lint`, `pnpm run type-check`, and `pnpm test`.
```

---

## 4. SplitLedger — Group Expense Splitter & Budget Tracker

**Why it fits Swapstack:** Users can start splitting a trip or dinner bill immediately as a guest (`auth.signInAnonymously()`), link an account (`auth.linkAccount`) before signing out so they never lose their ledger, and unlock multi-group ledgers and summary exports with a `pro` subscription.

### Scaffold Command

```sh
npx create-swapstack-app splitledger --name "SplitLedger" --bundle-id com.acme.splitledger --yes
cd splitledger
```

### Core Contract (`src/core/ledger.ts`)

```ts
export type ExpenseItem = {
  id: string;
  description: string;
  amountCents: number;
  paidBy: string;
  participants: string[];
  createdAt: string;
};

export type BalanceSummary = {
  member: string;
  netCents: number;
};

export type LedgerRepository = {
  readonly mode: 'mock' | 'live';
  listExpenses: (userId: string) => Promise<ExpenseItem[]>;
  addExpense: (userId: string, expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => Promise<ExpenseItem>;
  getBalances: (userId: string) => Promise<BalanceSummary[]>;
};
```

### Copy-Paste AI Agent Prompt

```text
Build the "SplitLedger" Expense Splitter app in this Swapstack project following `AGENTS.md`:

1. Create `src/core/ledger.ts` with `ExpenseItem`, `BalanceSummary`, and `LedgerRepository` types.
2. Implement `MockLedgerRepository` in `src/core/mocks/mock-ledger-repository.ts` that calculates net per-member balances in cents, and verify it with `describeLedgerRepositoryContract` in `src/core/contracts/ledger-repository.contract.ts`.
3. Register `ledger` in `src/lib/providers/registry.ts` and expose `serviceProviders.ledger` in `src/lib/services/index.ts`.
4. Update `src/app/(app)/index.tsx` using `@/components/ui` primitives so users can add expenses, view net balances, see a guest-account upgrade reminder linking to `/profile` when `session.user.isAnonymous` is true, and unlock settlement export via `/paywall`.
5. Write tests in `src/app/(app)/__tests__/index.test.tsx` verifying expense creation, net balance calculation, and guest-account reminder rendering.
6. Run `pnpm run lint`, `pnpm run type-check`, and `pnpm test`.
```
