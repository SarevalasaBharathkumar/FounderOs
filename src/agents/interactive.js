"use client";

import AGENTS from "./registry";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

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

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.REACT_APP_OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
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
