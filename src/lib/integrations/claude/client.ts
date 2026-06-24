// Claude API client wrapper — Step 5.2
// Security: API key from env/Key Vault, never logged [R20, R21]

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export async function sendMessage(
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<ChatResponse> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((b) => b.type === "text");

  return {
    content: textBlock?.text ?? "I was unable to generate a response.",
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
