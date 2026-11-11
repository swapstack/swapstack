import {
  describeAiProviderContract,
  describeErrorReporterProviderContract,
} from '../contracts';
import { MockAiProvider, MockErrorReporterProvider } from '../mocks';

describeAiProviderContract('MockAiProvider', () => new MockAiProvider());
describeErrorReporterProviderContract(
  'MockErrorReporterProvider',
  () => new MockErrorReporterProvider(),
);

describe('mockAiProvider & MockErrorReporterProvider helpers', () => {
  it('supports canned replies and history tracking in MockAiProvider', async () => {
    const ai = new MockAiProvider();
    ai.setCannedReply('Custom reply');
    const result = await ai.complete('Hello');
    expect(result.text).toBe('Custom reply');
    expect(ai.getHistory()).toHaveLength(1);
    ai.reset();
    expect(ai.getHistory()).toHaveLength(0);
  });

  it('tracks breadcrumbs and user metadata in MockErrorReporterProvider', async () => {
    const reporter = new MockErrorReporterProvider();
    await reporter.setUser({ id: 'u1', email: 'u1@example.com' });
    await reporter.addBreadcrumb({ category: 'auth', message: 'Signed in' });
    await reporter.captureException(new Error('Crash'));
    expect(reporter.getReports()[0]?.user?.id).toBe('u1');
    expect(reporter.getBreadcrumbs()).toHaveLength(1);
    reporter.reset();
    expect(reporter.getReports()).toHaveLength(0);
  });
});
