import type {
  FileStorageProvider,
  UploadedFile,
  UploadFileInput,
} from '../file-storage';

export class MockFileStorageProvider implements FileStorageProvider {
  readonly mode = 'mock' as const;
  private readonly files = new Map<string, UploadedFile>();

  private makeKey(bucket: string, path: string): string {
    return `${bucket}::${path}`;
  }

  readonly upload = async (input: UploadFileInput): Promise<UploadedFile> => {
    const cleanBucket = input.bucket.trim();
    const cleanPath = input.path.trim().replace(/^\/+/, '');
    if (!cleanBucket || !cleanPath) {
      throw new Error('Bucket and path are required for file upload.');
    }

    const file: UploadedFile = {
      bucket: cleanBucket,
      path: cleanPath,
      publicUrl: `https://mock-storage.local/${cleanBucket}/${cleanPath}`,
      mimeType: input.mimeType ?? 'application/octet-stream',
      sizeBytes: input.sizeBytes,
      uploadedAt: new Date().toISOString(),
    };

    this.files.set(this.makeKey(cleanBucket, cleanPath), structuredClone(file));
    return structuredClone(file);
  };

  readonly getPublicUrl = async (bucket: string, path: string): Promise<string | null> => {
    const cleanBucket = bucket.trim();
    const cleanPath = path.trim().replace(/^\/+/, '');
    const found = this.files.get(this.makeKey(cleanBucket, cleanPath));
    return found ? found.publicUrl : null;
  };

  readonly list = async (bucket: string, prefix?: string): Promise<UploadedFile[]> => {
    const cleanBucket = bucket.trim();
    const cleanPrefix = prefix?.trim().replace(/^\/+/, '') ?? '';
    const results: UploadedFile[] = [];

    for (const file of this.files.values()) {
      if (file.bucket === cleanBucket && file.path.startsWith(cleanPrefix)) {
        results.push(structuredClone(file));
      }
    }
    return results;
  };

  readonly remove = async (bucket: string, path: string): Promise<void> => {
    const cleanBucket = bucket.trim();
    const cleanPath = path.trim().replace(/^\/+/, '');
    this.files.delete(this.makeKey(cleanBucket, cleanPath));
  };

  readonly reset = (): void => {
    this.files.clear();
  };
}
