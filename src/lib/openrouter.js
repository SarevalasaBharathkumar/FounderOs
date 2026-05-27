"use client";

import { getProviderConfig } from "../agents/provider";

export default async function callOpenRouter({
  systemPrompt,
  userMessage,
  maxTokens = 1600,
  temperature = 0.7,
}) {
  const provider = getProviderConfig();

  const response = await fetch(provider.url, {
    method: "POST",
    headers: provider.headers,
    body: JSON.stringify({
      model: "openai/gpt-oss-120b:free",
      messages: [
        { role: "system", content: systemPrompt || "" },
        { role: "user", content: userMessage || "" },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty model response");
  }

  return typeof content === "string" ? content.trim() : content;
}
