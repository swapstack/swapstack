import type { FileStorageProvider } from '../file-storage';

export function describeFileStorageProviderContract(
  createProvider: () => Promise<FileStorageProvider> | FileStorageProvider,
) {
  describe('file storage provider contract', () => {
    let storage: FileStorageProvider;

    beforeEach(async () => {
      storage = await createProvider();
    });

    it('returns null public URL for non-existent file', async () => {
      const url = await storage.getPublicUrl('avatars', 'missing.png');
      expect(url).toBeNull();
    });

    it('uploads a file and retrieves its public URL and bucket listing', async () => {
      const uploaded = await storage.upload({
        bucket: 'avatars',
        path: 'users/user_1/avatar.png',
        uri: 'file:///tmp/avatar.png',
        mimeType: 'image/png',
        sizeBytes: 2048,
      });

      expect(uploaded.bucket).toBe('avatars');
      expect(uploaded.path).toBe('users/user_1/avatar.png');
      expect(uploaded.mimeType).toBe('image/png');
      expect(uploaded.publicUrl).toContain('avatars/users/user_1/avatar.png');

      const publicUrl = await storage.getPublicUrl('avatars', 'users/user_1/avatar.png');
      expect(publicUrl).toBe(uploaded.publicUrl);

      const list = await storage.list('avatars', 'users/user_1');
      expect(list).toHaveLength(1);
      expect(list[0]?.path).toBe('users/user_1/avatar.png');
    });

    it('removes a previously uploaded file', async () => {
      await storage.upload({
        bucket: 'avatars',
        path: 'temp/photo.jpg',
        uri: 'file:///tmp/photo.jpg',
      });

      await storage.remove('avatars', 'temp/photo.jpg');
      const url = await storage.getPublicUrl('avatars', 'temp/photo.jpg');
      expect(url).toBeNull();
    });
  });
}
