import type { AiProvider } from '../ai';

export function describeAiProviderContract(
  label: string,
  createProvider: () => AiProvider | Promise<AiProvider>,
): void {
  describe(`AiProvider contract (${label})`, () => {
    it('completes a single prompt and returns usage metrics', async () => {
      const provider = await createProvider();
      const response = await provider.complete('Summarize today\'s workout', {
        model: 'gpt-4o-mini',
      });

      expect(response.text.length).toBeGreaterThan(0);
      expect(response.model).toBe('gpt-4o-mini');
      expect(response.usage.totalTokens).toBeGreaterThanOrEqual(
        response.usage.promptTokens + response.usage.completionTokens,
      );
    });

    it('completes a multi-turn chat conversation', async () => {
      const provider = await createProvider();
      const response = await provider.chat([
        { role: 'system', content: 'You are a concise assistant.' },
        { role: 'user', content: 'Hello there' },
      ]);

      expect(response.text.length).toBeGreaterThan(0);
      expect(response.usage.promptTokens).toBeGreaterThan(0);
      expect(response.usage.completionTokens).toBeGreaterThan(0);
    });

    it('rejects empty prompts and empty chat arrays', async () => {
      const provider = await createProvider();
      await expect(provider.complete('   ')).rejects.toThrow();
      await expect(provider.chat([])).rejects.toThrow();
    });
  });
}
