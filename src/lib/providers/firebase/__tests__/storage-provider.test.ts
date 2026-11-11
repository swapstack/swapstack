import type { FirebaseStorageClient } from '../storage-provider';
import type { UploadedFile } from '@/core/file-storage';
import { describeFileStorageProviderContract } from '@/core/contracts/file-storage-provider.contract';
import { createFirebaseFileStorageProvider } from '../storage-provider';

function createFakeFirebaseStorageClient(): FirebaseStorageClient {
  const objects = new Map<string, UploadedFile>();

  return {
    putFile: jest.fn(async (input) => {
      const record: UploadedFile = {
        bucket: input.bucket,
        path: input.path,
        publicUrl: `https://firebasestorage.googleapis.com/v0/b/demo/o/${input.bucket}/${input.path}`,
        mimeType: input.mimeType ?? 'application/octet-stream',
        sizeBytes: input.sizeBytes,
        uploadedAt: new Date().toISOString(),
      };
      objects.set(`${input.bucket}/${input.path}`, record);
      return record;
    }),
    getDownloadURL: jest.fn(async (bucket, path) => {
      return objects.get(`${bucket}/${path}`)?.publicUrl ?? null;
    }),
    listAll: jest.fn(async (bucket, prefix) => {
      const list: UploadedFile[] = [];
      objects.forEach((item) => {
        if (item.bucket === bucket && (!prefix || item.path.startsWith(prefix))) {
          list.push(item);
        }
      });
      return list;
    }),
    deleteObject: jest.fn(async (bucket, path) => {
      objects.delete(`${bucket}/${path}`);
    }),
  };
}

describe('firebase file storage provider', () => {
  describeFileStorageProviderContract(() =>
    createFirebaseFileStorageProvider(createFakeFirebaseStorageClient()),
  );
});
