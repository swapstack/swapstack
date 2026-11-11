import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const BLUEPRINT_PRESETS = [
  'default',
  'pulse',
  'memostack',
  'promptbox',
  'splitledger',
] as const;

export type BlueprintPreset = typeof BLUEPRINT_PRESETS[number];

export function validateBlueprintPreset(value: string): value is BlueprintPreset {
  return (BLUEPRINT_PRESETS as readonly string[]).includes(value);
}

type BlueprintSpec = {
  readonly domainFile: string;
  readonly contractSource: string;
  readonly tagline: string;
};

const BLUEPRINT_SPECS: Record<Exclude<BlueprintPreset, 'default'>, BlueprintSpec> = {
  pulse: {
    domainFile: 'workouts.ts',
    tagline: 'Habit & workout tracker powered by WorkoutRepository and Pro streak analytics.',
    contractSource: `export type WorkoutEntry = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly durationMinutes: number;
  readonly completedAt: string;
};

export type WorkoutStats = {
  readonly totalWorkouts: number;
  readonly currentStreakDays: number;
  readonly totalMinutes: number;
};

export type WorkoutRepository = {
  readonly mode: 'mock' | 'live';
  readonly list: (userId: string) => Promise<WorkoutEntry[]>;
  readonly log: (userId: string, input: { readonly title: string; readonly durationMinutes: number }) => Promise<WorkoutEntry>;
  readonly remove: (userId: string, workoutId: string) => Promise<void>;
  readonly getStats: (userId: string) => Promise<WorkoutStats>;
};
`,
  },
  memostack: {
    domainFile: 'decks.ts',
    tagline: 'Offline-first spaced repetition flashcards powered by DeckRepository.',
    contractSource: `export type Flashcard = {
  readonly id: string;
  readonly front: string;
  readonly back: string;
  readonly mastered: boolean;
};

export type StudyDeck = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly cards: readonly Flashcard[];
  readonly updatedAt: string;
};

export type DeckRepository = {
  readonly mode: 'mock' | 'live';
  readonly listDecks: (userId: string) => Promise<StudyDeck[]>;
  readonly createDeck: (userId: string, title: string) => Promise<StudyDeck>;
  readonly addCard: (userId: string, deckId: string, card: { readonly front: string; readonly back: string }) => Promise<StudyDeck>;
  readonly toggleMastered: (userId: string, deckId: string, cardId: string) => Promise<StudyDeck>;
};
`,
  },
  promptbox: {
    domainFile: 'assistant.ts',
    tagline: 'AI prompt threads & quota management powered by AssistantProvider.',
    contractSource: `export type ChatMessage = {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly createdAt: string;
};

export type ChatThread = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly messages: readonly ChatMessage[];
};

export type AssistantProvider = {
  readonly mode: 'mock' | 'live';
  readonly listThreads: (userId: string) => Promise<ChatThread[]>;
  readonly sendMessage: (userId: string, input: { readonly threadId?: string; readonly prompt: string }) => Promise<ChatThread>;
  readonly deleteThread: (userId: string, threadId: string) => Promise<void>;
};
`,
  },
  splitledger: {
    domainFile: 'ledger.ts',
    tagline: 'Group expense splitter & net settlement ledger powered by LedgerRepository.',
    contractSource: `export type ExpenseItem = {
  readonly id: string;
  readonly description: string;
  readonly amountCents: number;
  readonly paidBy: string;
  readonly participants: readonly string[];
  readonly createdAt: string;
};

export type BalanceSummary = {
  readonly member: string;
  readonly netCents: number;
};

export type LedgerRepository = {
  readonly mode: 'mock' | 'live';
  readonly listExpenses: (userId: string) => Promise<ExpenseItem[]>;
  readonly addExpense: (userId: string, expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => Promise<ExpenseItem>;
  readonly getBalances: (userId: string) => Promise<BalanceSummary[]>;
};
`,
  },
};

export async function applyBlueprint(
  targetDir: string,
  blueprint: BlueprintPreset,
): Promise<void> {
  if (blueprint === 'default') {
    return;
  }

  const spec = BLUEPRINT_SPECS[blueprint];
  const coreDir = path.join(targetDir, 'src/core');
  await mkdir(coreDir, { recursive: true });
  await writeFile(path.join(coreDir, spec.domainFile), spec.contractSource, 'utf8');

  const coreIndexPath = path.join(coreDir, 'index.ts');
  if (existsSync(coreIndexPath)) {
    const existing = await readFile(coreIndexPath, 'utf8');
    const exportLine = `export * from './${spec.domainFile.replace(/\.ts$/, '')}';\n`;
    if (!existing.includes(exportLine.trim())) {
      await writeFile(coreIndexPath, `${existing.trimEnd()}\n${exportLine}`, 'utf8');
    }
  }

  const readmePath = path.join(targetDir, 'README.md');
  if (existsSync(readmePath)) {
    const readme = await readFile(readmePath, 'utf8');
    await writeFile(
      readmePath,
      `${readme.trimEnd()}\n\n## Starter Blueprint: \`${blueprint}\`\n\n- Domain Contract: \`src/core/${spec.domainFile}\`\n- Summary: ${spec.tagline}\n`,
      'utf8',
    );
  }
}
