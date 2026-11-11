import type {
  AiCompletionOptions,
  AiCompletionResponse,
  AiMessage,
  AiProvider,
} from '../ai';

export class MockAiProvider implements AiProvider {
  public readonly mode = 'mock' as const;
  private readonly defaultModel: string;
  private cannedReply: string | null = null;
  private readonly history: AiMessage[][] = [];

  public constructor(defaultModel = 'mock-gpt-4o-mini') {
    this.defaultModel = defaultModel;
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

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content.trim()) {
      throw new Error('Last AI message content must not be empty.');
    }

    this.history.push([...messages]);

    const model = options?.model?.trim() || this.defaultModel;
    const text = this.cannedReply ?? `[Mock AI (${model})]: ${lastMessage.content.trim()}`;
    const promptTokens = messages.reduce(
      (sum, msg) => sum + Math.max(1, Math.ceil(msg.content.length / 4)),
      0,
    );
    const completionTokens = Math.max(1, Math.ceil(text.length / 4));

    return {
      text,
      model,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }

  public setCannedReply(reply: string | null): void {
    this.cannedReply = reply;
  }

  public getHistory(): readonly (readonly AiMessage[])[] {
    return [...this.history];
  }

  public reset(): void {
    this.cannedReply = null;
    this.history.length = 0;
  }
}
