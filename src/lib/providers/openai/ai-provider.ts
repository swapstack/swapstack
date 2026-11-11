import type {
  AiCompletionOptions,
  AiCompletionResponse,
  AiMessage,
  AiProvider,
} from '@/core/ai';

export type OpenAiCompletionPayload = {
  readonly model: string;
  readonly messages: readonly AiMessage[];
  readonly temperature?: number;
  readonly max_tokens?: number;
};

export type OpenAiCompletionRawResponse = {
  readonly model?: string;
  readonly choices?: readonly {
    readonly message?: {
      readonly content?: string | null;
    };
  }[];
  readonly usage?: {
    readonly prompt_tokens?: number;
    readonly completion_tokens?: number;
    readonly total_tokens?: number;
  };
};

export type OpenAiClientAdapter = {
  readonly createChatCompletion: (
    payload: OpenAiCompletionPayload,
  ) => Promise<OpenAiCompletionRawResponse>;
};

/**
 * Configuration options for OpenAiProvider.
 *
 * Security Notice:
 * For production releases, avoid embedding raw OpenAI API keys directly in mobile
 * application bundles via EXPO_PUBLIC_OPENAI_API_KEY. Instead, point `baseUrl`
 * (or EXPO_PUBLIC_OPENAI_BASE_URL) to an authenticated backend proxy or serverless
 * edge function (e.g. Supabase Edge Functions, Cloudflare Workers, Next.js), or
 * pass a custom `client` adapter.
 */
export type OpenAiProviderConfig = {
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly defaultModel?: string;
  readonly client?: OpenAiClientAdapter;
};

function createFetchOpenAiClient(
  apiKey: string,
  baseUrl: string,
): OpenAiClientAdapter {
  return {
    async createChatCompletion(payload) {
      const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed with status ${response.status}`);
      }

      return (await response.json()) as OpenAiCompletionRawResponse;
    },
  };
}

export class OpenAiProvider implements AiProvider {
  public readonly mode = 'live' as const;
  private readonly client: OpenAiClientAdapter;
  private readonly defaultModel: string;

  public constructor(config: OpenAiProviderConfig = {}) {
    this.defaultModel = config.defaultModel?.trim() || 'gpt-4o-mini';

    if (config.client) {
      this.client = config.client;
      return;
    }

    const apiKey = (config.apiKey ?? process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '').trim();
    if (!apiKey) {
      throw new Error('Missing EXPO_PUBLIC_OPENAI_API_KEY for OpenAI provider.');
    }

    const baseUrl = (
      config.baseUrl
      ?? process.env.EXPO_PUBLIC_OPENAI_BASE_URL
      ?? 'https://api.openai.com/v1'
    ).trim();

    if (
      baseUrl === 'https://api.openai.com/v1'
      && typeof process !== 'undefined'
      && process.env.NODE_ENV === 'development'
    ) {
      console.warn(
        '[Swapstack] Caution: Direct OpenAI client keys in EXPO_PUBLIC_OPENAI_API_KEY are visible in mobile bundles. For production apps, route through a proxy via EXPO_PUBLIC_OPENAI_BASE_URL.',
      );
    }

    this.client = createFetchOpenAiClient(apiKey, baseUrl);
  }

  public async complete(
    prompt: string,
    options?: AiCompletionOptions,
  ): Promise<AiCompletionResponse> {
    const trimmed = prompt.trim();
    if (!trimmed) {
      throw new Error('AI prompt must not be empty.');
    }

    const messages: AiMessage[] = options?.systemPrompt
      ? [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: trimmed },
        ]
      : [{ role: 'user', content: trimmed }];

    return this.chat(messages, options);
  }

  public async chat(
    messages: readonly AiMessage[],
    options?: AiCompletionOptions,
  ): Promise<AiCompletionResponse> {
    if (messages.length === 0) {
      throw new Error('AI chat messages must not be empty.');
    }

    const last = messages[messages.length - 1];
    if (!last || !last.content.trim()) {
      throw new Error('Last AI message content must not be empty.');
    }

    const model = options?.model?.trim() || this.defaultModel;
    const raw = await this.client.createChatCompletion({
      model,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
    });

    const text = raw.choices?.[0]?.message?.content?.trim() ?? '';
    const promptTokens = raw.usage?.prompt_tokens ?? 1;
    const completionTokens = raw.usage?.completion_tokens ?? Math.max(1, Math.ceil(text.length / 4));
    const totalTokens = raw.usage?.total_tokens ?? promptTokens + completionTokens;

    return {
      text,
      model: raw.model ?? model,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
    };
  }
}

export function createOpenAiProvider(config?: OpenAiProviderConfig): OpenAiProvider {
  return new OpenAiProvider(config);
}
