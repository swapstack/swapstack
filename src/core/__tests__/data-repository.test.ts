import { describeDataRepositoryContract } from '../contracts/data-repository.contract';
import { MockDataRepository } from '../mocks/mock-data-repository';

describe('mockDataRepository Contract Suite', () => {
  describeDataRepositoryContract(() => new MockDataRepository());
});
