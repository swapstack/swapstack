import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataRepository } from '@/core/data';
import type { Profile, Unsubscribe } from '@/core/types';

type ProfileRow = {
  readonly id: string;
  readonly email?: string | null;
  readonly display_name?: string | null;
  readonly avatar_url?: string | null;
  readonly updated_at?: string | null;
  readonly metadata?: Record<string, unknown> | null;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email ?? undefined,
    displayName: row.display_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    metadata: row.metadata ?? undefined,
  };
}

function mapUpdate(data: Partial<Profile>): Partial<ProfileRow> {
  return {
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.displayName !== undefined ? { display_name: data.displayName } : {}),
    ...(data.avatarUrl !== undefined ? { avatar_url: data.avatarUrl } : {}),
    ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
  };
}

export class SupabaseProfileRepository implements DataRepository<Profile> {
  readonly mode = 'live' as const;

  constructor(private readonly client: SupabaseClient) {}

  get = async (id: string): Promise<Profile | null> => {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      throw new Error('Unable to load profile.');
    }
    return data ? mapProfile(data as ProfileRow) : null;
  };

  update = async (id: string, data: Partial<Profile>): Promise<Profile> => {
    const { data: row, error } = await this.client
      .from('profiles')
      .upsert({ id, ...mapUpdate(data) }, { onConflict: 'id' })
      .select('*')
      .single();
    if (error || !row) {
      throw new Error('Unable to save profile.');
    }
    return mapProfile(row as ProfileRow);
  };

  subscribe = (id: string, callback: (data: Profile | null) => void): Unsubscribe => {
    const channel = this.client
      .channel(`profiles:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          callback(payload.new ? mapProfile(payload.new as ProfileRow) : null);
        },
      )
      .subscribe();

    return () => {
      void this.client.removeChannel(channel);
    };
  };
}

export function createSupabaseProfileRepository(client: SupabaseClient): SupabaseProfileRepository {
  return new SupabaseProfileRepository(client);
}
