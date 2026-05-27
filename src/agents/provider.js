"use client";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export function getProviderConfig() {
  const openRouterKey =
    process.env.NEXT_PUBLIC_OPENROUTER_KEY || process.env.REACT_APP_OPENROUTER_KEY;
  const openAiKey =
    process.env.NEXT_PUBLIC_OPENAI_KEY || process.env.REACT_APP_OPENAI_KEY;

  if (openRouterKey) {
    return {
      provider: "OpenRouter",
      keySource: process.env.NEXT_PUBLIC_OPENROUTER_KEY
        ? "NEXT_PUBLIC_OPENROUTER_KEY"
        : "REACT_APP_OPENROUTER_KEY",
      url: OPENROUTER_URL,
      key: openRouterKey,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterKey}`,
      },
    };
  }

  if (openAiKey) {
    return {
      provider: "OpenAI",
      keySource: process.env.NEXT_PUBLIC_OPENAI_KEY
        ? "NEXT_PUBLIC_OPENAI_KEY"
        : "REACT_APP_OPENAI_KEY",
      url: OPENAI_URL,
      key: openAiKey,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
    };
  }

  throw new Error(
    "Missing API key. Set NEXT_PUBLIC_OPENAI_KEY or NEXT_PUBLIC_OPENROUTER_KEY (or REACT_APP_* fallback)."
  );
}
