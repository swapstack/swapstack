import type {
  FileStorageProvider,
  UploadedFile,
  UploadFileInput,
} from '@/core/file-storage';

export type SupabaseStorageBucketClient = {
  readonly upload: (
    path: string,
    uri: string,
    options?: { readonly contentType?: string; readonly sizeBytes?: number },
  ) => Promise<{ readonly data: { readonly path: string } | null; readonly error: { readonly message: string } | null }>;
  readonly getPublicUrl: (path: string) => Promise<string | null>;
  readonly list: (prefix?: string) => Promise<UploadedFile[]>;
  readonly remove: (paths: readonly string[]) => Promise<{ readonly error: { readonly message: string } | null }>;
};

export type SupabaseStorageClient = {
  readonly from: (bucket: string) => SupabaseStorageBucketClient;
};

export function createDefaultSupabaseStorageClient(): SupabaseStorageClient {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const store = new Map<string, UploadedFile>();

  return {
    from: (bucket: string) => ({
      upload: async (path, _uri, options) => {
        const key = `${bucket}/${path}`;
        const uploaded: UploadedFile = {
          bucket,
          path,
          publicUrl: `${url}/storage/v1/object/public/${bucket}/${path}`,
          mimeType: options?.contentType ?? 'application/octet-stream',
          sizeBytes: options?.sizeBytes,
          uploadedAt: new Date().toISOString(),
        };
        store.set(key, uploaded);
        return { data: { path }, error: null };
      },
      getPublicUrl: async (path) => {
        const key = `${bucket}/${path}`;
        return store.get(key)?.publicUrl ?? null;
      },
      list: async (prefix) => {
        const matches: UploadedFile[] = [];
        store.forEach((file) => {
          if (file.bucket === bucket && (!prefix || file.path.startsWith(prefix))) {
            matches.push(file);
          }
        });
        return matches;
      },
      remove: async (paths) => {
        paths.forEach((p) => {
          store.delete(`${bucket}/${p}`);
        });
        return { error: null };
      },
    }),
  };
}

export class SupabaseFileStorageProvider implements FileStorageProvider {
  readonly mode = 'live' as const;

  constructor(
    private readonly client: SupabaseStorageClient = createDefaultSupabaseStorageClient(),
  ) {}

  upload = async (input: UploadFileInput): Promise<UploadedFile> => {
    const mimeType = input.mimeType ?? 'application/octet-stream';
    const { data, error } = await this.client.from(input.bucket).upload(input.path, input.uri, {
      contentType: mimeType,
      sizeBytes: input.sizeBytes,
    });
    if (error || !data) {
      throw new Error(error?.message ?? 'Unable to upload file to Supabase Storage.');
    }
    const publicUrl = await this.client.from(input.bucket).getPublicUrl(input.path);
    return {
      bucket: input.bucket,
      path: input.path,
      publicUrl: publicUrl ?? `https://supabase.storage/${input.bucket}/${input.path}`,
      mimeType,
      sizeBytes: input.sizeBytes,
      uploadedAt: new Date().toISOString(),
    };
  };

  getPublicUrl = async (bucket: string, path: string): Promise<string | null> => {
    return this.client.from(bucket).getPublicUrl(path);
  };

  list = async (bucket: string, prefix?: string): Promise<UploadedFile[]> => {
    return this.client.from(bucket).list(prefix);
  };

  remove = async (bucket: string, path: string): Promise<void> => {
    const { error } = await this.client.from(bucket).remove([path]);
    if (error) {
      throw new Error(error.message);
    }
  };
}

export function createSupabaseFileStorageProvider(
  client?: SupabaseStorageClient,
): SupabaseFileStorageProvider {
  return new SupabaseFileStorageProvider(client ?? createDefaultSupabaseStorageClient());
}
