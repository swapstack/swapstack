import { describeFileStorageProviderContract } from '../contracts/file-storage-provider.contract';
import { MockFileStorageProvider } from '../mocks/mock-file-storage';

describe('mock file storage provider contracts', () => {
  describeFileStorageProviderContract(() => new MockFileStorageProvider());

  it('rejects empty bucket or path on upload', async () => {
    const provider = new MockFileStorageProvider();
    await expect(
      provider.upload({ bucket: '', path: 'avatar.png', uri: 'file:///a.png' }),
    ).rejects.toThrow('Bucket and path are required');
  });
});
