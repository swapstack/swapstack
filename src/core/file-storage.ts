export type UploadedFile = {
  readonly bucket: string;
  readonly path: string;
  readonly publicUrl: string;
  readonly mimeType: string;
  readonly sizeBytes?: number;
  readonly uploadedAt: string;
};

export type UploadFileInput = {
  readonly bucket: string;
  readonly path: string;
  readonly uri: string;
  readonly mimeType?: string;
  readonly sizeBytes?: number;
};

export type FileStorageProvider = {
  readonly mode?: 'mock' | 'live';
  readonly upload: (input: UploadFileInput) => Promise<UploadedFile>;
  readonly getPublicUrl: (bucket: string, path: string) => Promise<string | null>;
  readonly list: (bucket: string, prefix?: string) => Promise<UploadedFile[]>;
  readonly remove: (bucket: string, path: string) => Promise<void>;
};
