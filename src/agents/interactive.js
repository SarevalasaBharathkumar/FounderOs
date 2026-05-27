"use client";

import AGENTS from "./registry";
import { getProviderConfig } from "./provider";

export const ADVISOR_SYSTEM_PROMPT = `You are a sharp startup advisor embedded inside FounderOS.
The founder has already received a structured analysis from you.
Now they are asking a follow-up question or pushing back.
Respond in plain conversational English — NO JSON, no markdown code blocks,
no bullet point overload. Be direct, specific, and actionable.
2-4 short paragraphs maximum. Talk like a brilliant co-founder, not a consultant.`;

function safeParseJson(content) {
  if (!content) {
    return null;
  }

  const cleaned = content.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function callAgentWithPrompt(agentId, prompt) {
  const agent = AGENTS[agentId];
  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  const provider = getProviderConfig();
  const response = await fetch(provider.url, {
    method: "POST",
    headers: provider.headers,
    body: JSON.stringify({
      model: "openai/gpt-oss-120b:free",
      messages: [
        { role: "system", content: agent.systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const payload = await response.json();
  const raw = payload?.choices?.[0]?.message?.content;
  const parsed = safeParseJson(raw);

  if (!parsed) {
    throw new Error("No JSON content returned by model");
  }

  return parsed;
}

export async function callAdvisorFollowup({
  objective,
  data,
  conversationHistory,
  userMessage,
  signal,
}) {
  const provider = getProviderConfig();
  const initialContext = `Context — Original objective: ${objective}

My previous analysis covered: ${JSON.stringify(data).slice(0, 800)}

The founder now says: "${userMessage}"

Respond conversationally. Be specific to their situation.`;

  const response = await fetch(provider.url, {
    method: "POST",
    headers: provider.headers,
    signal,
    body: JSON.stringify({
      model: "openai/gpt-oss-120b:free",
      messages: [
        { role: "system", content: ADVISOR_SYSTEM_PROMPT },
        { role: "user", content: initialContext },
        ...(conversationHistory || []),
      ],
      max_tokens: 900,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Empty conversational response from advisor");
  }

  return content;
}

export function pushActivity(type, section) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = JSON.parse(localStorage.getItem("founderos-activity") || "[]");
  existing.unshift({ type, section, ts: Date.now() });
  localStorage.setItem("founderos-activity", JSON.stringify(existing.slice(0, 200)));
}

export function getTaskStorage() {
  if (typeof window === "undefined") {
    return { checked: {}, labels: {}, nextSteps: [], objective: "" };
  }

  return JSON.parse(
    localStorage.getItem("founderos-tasks") || '{"checked":{},"labels":{},"nextSteps":[],"objective":""}'
  );
}

export function setTaskStorage(payload) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem("founderos-tasks", JSON.stringify(payload));
}
