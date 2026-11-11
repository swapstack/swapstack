export type AiRole = 'system' | 'user' | 'assistant';

export type AiMessage = {
  readonly role: AiRole;
  readonly content: string;
};

export type AiCompletionOptions = {
  readonly model?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly systemPrompt?: string;
};

export type AiCompletionResponse = {
  readonly text: string;
  readonly model: string;
  readonly usage: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
};

export type AiProvider = {
  readonly mode?: 'live' | 'mock';
  readonly complete: (
    prompt: string,
    options?: AiCompletionOptions,
  ) => Promise<AiCompletionResponse>;
  readonly chat: (
    messages: readonly AiMessage[],
    options?: AiCompletionOptions,
  ) => Promise<AiCompletionResponse>;
};
