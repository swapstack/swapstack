import type { OpenAiClientAdapter } from '../ai-provider';
import { describeAiProviderContract } from '@/core/contracts';
import { createOpenAiProvider } from '../ai-provider';

function createFakeOpenAiClient(): OpenAiClientAdapter {
  return {
    async createChatCompletion(payload) {
      const last = payload.messages[payload.messages.length - 1];
      const text = `Reply to: ${last?.content ?? ''}`;
      return {
        model: payload.model,
        choices: [{ message: { content: text } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 8,
          total_tokens: 18,
        },
      };
    },
  };
}

describeAiProviderContract('OpenAiProvider', () =>
  createOpenAiProvider({ client: createFakeOpenAiClient() }));

describe('openAiProvider configuration', () => {
  it('throws when EXPO_PUBLIC_OPENAI_API_KEY is missing and no client is injected', () => {
    const prev = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    expect(() => createOpenAiProvider()).toThrow(/Missing EXPO_PUBLIC_OPENAI_API_KEY/);
    if (prev !== undefined) {
      process.env.EXPO_PUBLIC_OPENAI_API_KEY = prev;
    }
  });

  it('warns when using direct OpenAI endpoint in development mode', () => {
    const origKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    const origEnv = process.env.NODE_ENV;
    const envObj = process.env as Record<string, string | undefined>;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      envObj.EXPO_PUBLIC_OPENAI_API_KEY = 'sk-test-key';
      envObj.NODE_ENV = 'development';
      createOpenAiProvider();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Swapstack] Caution: Direct OpenAI client keys'),
      );
    }
    finally {
      warnSpy.mockRestore();
      if (origKey !== undefined) {
        envObj.EXPO_PUBLIC_OPENAI_API_KEY = origKey;
      }
      else {
        delete envObj.EXPO_PUBLIC_OPENAI_API_KEY;
      }
      envObj.NODE_ENV = origEnv;
    }
  });
});
