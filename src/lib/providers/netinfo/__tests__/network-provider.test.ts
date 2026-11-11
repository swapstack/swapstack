import { describeNetworkProviderContract } from '@/core/contracts';
import { createNetInfoNetworkProvider } from '../network-provider';

describeNetworkProviderContract(() => createNetInfoNetworkProvider());
