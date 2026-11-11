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
});
