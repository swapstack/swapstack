import type { NetworkProvider } from '../network';

export function describeNetworkProviderContract(
  createProvider: () => Promise<NetworkProvider> | NetworkProvider,
) {
  describe('network provider contract', () => {
    let network: NetworkProvider;

    beforeEach(async () => {
      network = await createProvider();
    });

    it('resolves current network status and online boolean', async () => {
      const status = await network.getStatus();
      expect(typeof status.isConnected).toBe('boolean');
      expect(typeof status.isInternetReachable).toBe('boolean');

      const online = await network.isOnline();
      expect(online).toBe(status.isConnected && status.isInternetReachable);
    });

    it('allows subscribing and unsubscribing to status changes', () => {
      const listener = jest.fn();
      const unsubscribe = network.onStatusChange(listener);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });
}
