import type { SupabaseStorageClient } from '../storage-provider';
import type { UploadedFile } from '@/core/file-storage';
import { describeFileStorageProviderContract } from '@/core/contracts/file-storage-provider.contract';
import { createSupabaseFileStorageProvider } from '../storage-provider';

function createFakeSupabaseStorageClient(): SupabaseStorageClient {
  const store = new Map<string, UploadedFile>();

  return {
    from: (bucket: string) => ({
      upload: jest.fn(async (path, _uri, options) => {
        const key = `${bucket}/${path}`;
        store.set(key, {
          bucket,
          path,
          publicUrl: `https://example.supabase.co/storage/v1/object/public/${bucket}/${path}`,
          mimeType: options?.contentType ?? 'application/octet-stream',
          sizeBytes: options?.sizeBytes,
          uploadedAt: new Date().toISOString(),
        });
        return { data: { path }, error: null };
      }),
      getPublicUrl: jest.fn(async (path) => {
        return store.get(`${bucket}/${path}`)?.publicUrl ?? null;
      }),
      list: jest.fn(async (prefix) => {
        const out: UploadedFile[] = [];
        store.forEach((f) => {
          if (f.bucket === bucket && (!prefix || f.path.startsWith(prefix))) {
            out.push(f);
          }
        });
        return out;
      }),
      remove: jest.fn(async (paths) => {
        paths.forEach((p) => {
          store.delete(`${bucket}/${p}`);
        });
        return { error: null };
      }),
    }),
  };
}

describe('supabase file storage provider', () => {
  describeFileStorageProviderContract(() =>
    createSupabaseFileStorageProvider(createFakeSupabaseStorageClient()),
  );
});
