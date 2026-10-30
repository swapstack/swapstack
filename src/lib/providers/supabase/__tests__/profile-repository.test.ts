import type { SupabaseClient } from '@supabase/supabase-js';
import { describeDataRepositoryContract } from '@/core/contracts';
import { SupabaseProfileRepository } from '../profile-repository';

type Row = {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
};

type Builder = {
  readonly select: () => Builder;
  readonly eq: (field: string, value: string) => Builder;
  readonly upsert: (payload: Partial<Row>) => Builder;
  readonly maybeSingle: () => Promise<{ data: Row | null; error: null }>;
  readonly single: () => Promise<{ data: Row | null; error: { message: string } | null }>;
  readonly on: (
    event: string,
    config: Record<string, unknown>,
    callback: (payload: { new: Row }) => void,
  ) => Builder;
  readonly subscribe: () => string;
};

function createMockClient() {
  const rows = new Map<string, Row>();
  let currentId: string | null = null;
  let pendingUpsert: Partial<Row> | null = null;
  let changeListener: ((payload: { new: Row }) => void) | null = null;
  let subscribedId: string | null = null;
  let channelActive = false;

  const notify = (row: Row) => {
    if (channelActive && subscribedId === row.id) {
      changeListener?.({ new: row });
    }
  };

  const builder: Builder = {
    select: jest.fn(() => builder),
    eq: jest.fn((_field: string, value: string) => {
      currentId = value;
      return builder;
    }),
    upsert: jest.fn((payload: Partial<Row>) => {
      pendingUpsert = payload;
      return builder;
    }),
    maybeSingle: jest.fn(async () => {
      const row = currentId ? rows.get(currentId) ?? null : null;
      return { data: row, error: null };
    }),
    single: jest.fn(async () => {
      if (!pendingUpsert?.id) {
        return { data: null, error: { message: 'Missing row' } };
      }
      const existing = rows.get(pendingUpsert.id) ?? { id: pendingUpsert.id };
      const row: Row = {
        ...existing,
        ...pendingUpsert,
        metadata: {
          ...(existing.metadata ?? {}),
          ...(pendingUpsert.metadata ?? {}),
        },
        updated_at: new Date().toISOString(),
      };
      rows.set(row.id, row);
      pendingUpsert = null;
      notify(row);
      return { data: row, error: null };
    }),
    on: jest.fn((
      _event: string,
      config: Record<string, unknown>,
      callback: (payload: { new: Row }) => void,
    ) => {
      const filter = typeof config.filter === 'string' ? config.filter : '';
      subscribedId = filter.startsWith('id=eq.') ? filter.slice('id=eq.'.length) : null;
      changeListener = callback;
      channelActive = true;
      return builder;
    }),
    subscribe: jest.fn(() => 'profiles-channel'),
  };

  const client = {
    from: jest.fn(() => builder),
    channel: jest.fn(() => builder),
    removeChannel: jest.fn(() => {
      channelActive = false;
      return Promise.resolve();
    }),
  };

  return { builder, client };
}

describe('supabase profile repository contract', () => {
  describeDataRepositoryContract(() => {
    const { client } = createMockClient();
    return new SupabaseProfileRepository(client as unknown as SupabaseClient);
  });

  it('maps Supabase row fields to the shared profile model', async () => {
    const { client } = createMockClient();
    const repo = new SupabaseProfileRepository(client as unknown as SupabaseClient);

    const profile = await repo.update('user_1', {
      email: 'user@example.com',
      displayName: 'Swapstack User',
      avatarUrl: 'https://example.com/avatar.png',
      metadata: { role: 'developer' },
    });

    expect(profile).toEqual({
      id: 'user_1',
      email: 'user@example.com',
      displayName: 'Swapstack User',
      avatarUrl: 'https://example.com/avatar.png',
      updatedAt: expect.any(String),
      metadata: { role: 'developer' },
    });
  });
});
