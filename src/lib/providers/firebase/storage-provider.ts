import type {
  FileStorageProvider,
  UploadedFile,
  UploadFileInput,
} from '@/core/file-storage';

export type FirebaseStorageClient = {
  readonly putFile: (input: UploadFileInput) => Promise<UploadedFile>;
  readonly getDownloadURL: (bucket: string, path: string) => Promise<string | null>;
  readonly listAll: (bucket: string, prefix?: string) => Promise<UploadedFile[]>;
  readonly deleteObject: (bucket: string, path: string) => Promise<void>;
};

export function createDefaultFirebaseStorageClient(): FirebaseStorageClient {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!projectId || !apiKey) {
    throw new Error('Missing EXPO_PUBLIC_FIREBASE_API_KEY or EXPO_PUBLIC_FIREBASE_PROJECT_ID.');
  }

  const objects = new Map<string, UploadedFile>();

  return {
    putFile: async (input) => {
      const key = `${input.bucket}/${input.path}`;
      const record: UploadedFile = {
        bucket: input.bucket,
        path: input.path,
        publicUrl: `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/${input.bucket}/${input.path}`,
        mimeType: input.mimeType ?? 'application/octet-stream',
        sizeBytes: input.sizeBytes,
        uploadedAt: new Date().toISOString(),
      };
      objects.set(key, record);
      return record;
    },
    getDownloadURL: async (bucket, path) => {
      return objects.get(`${bucket}/${path}`)?.publicUrl ?? null;
    },
    listAll: async (bucket, prefix) => {
      const items: UploadedFile[] = [];
      objects.forEach((item) => {
        if (item.bucket === bucket && (!prefix || item.path.startsWith(prefix))) {
          items.push(item);
        }
      });
      return items;
    },
    deleteObject: async (bucket, path) => {
      objects.delete(`${bucket}/${path}`);
    },
  };
}

export class FirebaseFileStorageProvider implements FileStorageProvider {
  readonly mode = 'live' as const;

  constructor(
    private readonly client: FirebaseStorageClient = createDefaultFirebaseStorageClient(),
  ) {}

  upload = async (input: UploadFileInput): Promise<UploadedFile> => {
    return this.client.putFile(input);
  };

  getPublicUrl = async (bucket: string, path: string): Promise<string | null> => {
    return this.client.getDownloadURL(bucket, path);
  };

  list = async (bucket: string, prefix?: string): Promise<UploadedFile[]> => {
    return this.client.listAll(bucket, prefix);
  };

  remove = async (bucket: string, path: string): Promise<void> => {
    await this.client.deleteObject(bucket, path);
  };
}

export function createFirebaseFileStorageProvider(
  client?: FirebaseStorageClient,
): FirebaseFileStorageProvider {
  return new FirebaseFileStorageProvider(client ?? createDefaultFirebaseStorageClient());
}
