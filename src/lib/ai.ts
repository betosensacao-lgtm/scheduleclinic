import OpenAI from "openai";

// ─── AI provider: Groq (OpenAI-compatible API) ───────────────────────────────
// Groq serves open models (Llama, GPT-OSS, Kimi…) over an OpenAI-compatible
// endpoint, so we reuse the `openai` SDK by pointing it at Groq's base URL.

// Lazy initialization - reads env vars at call time, not import time
let _ai: OpenAI | null = null;

function getAI(): OpenAI {
  if (!_ai) {
    const apiKey =
      process.env.GROQ_API_KEY?.trim() ||
      process.env.MEDBOOK_GROQ_API_KEY?.trim();
    
    _ai = new OpenAI({
      apiKey: apiKey ?? "missing-key",
      baseURL: "https://api.groq.com/openai/v1",
      defaultHeaders: {
        "Accept-Charset": "utf-8",
      },
    });
  }
  return _ai;
}

export const ai = new Proxy({} as OpenAI, {
  get(_, prop) {
    return (getAI() as any)[prop];
  },
});

// Model used for the conversational triage chat (good instruction-following).
export const CHAT_MODEL =
  process.env.GROQ_MODEL?.trim() || "meta-llama/llama-4-scout-17b-16e-instruct";

// Model used for the final structured JSON extraction (same default).
export const EXTRACTION_MODEL =
  process.env.GROQ_EXTRACTION_MODEL?.trim() || CHAT_MODEL;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Builds an OpenAI-style messages array from a system prompt + history + the
 * next user message.
 */
export function toChatMessages(
  systemPrompt: string,
  history: ChatTurn[],
  nextUserMessage: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    { role: "system", content: systemPrompt },
    ...history.map((turn) => ({
      role: turn.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: turn.content,
    })),
    { role: "user", content: nextUserMessage },
  ];
}
