import AGENTS from "./registry";
import { getProviderConfig } from "./provider";

function safeParseJson(content) {
  if (!content) {
    return null;
  }

  const cleaned = content.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const objectMatch = cleaned.match(/\{[\s\S]*\}$/);
    if (!objectMatch) {
      return null;
    }
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      return null;
    }
  }
}

export async function orchestrate(objective, setAgentStates, setLog) {
  const addLog = (msg, type = "info") => {
    setLog((prev) => [
      ...prev,
      { msg, type, ts: new Date().toLocaleTimeString() },
    ]);
  };

  addLog("Orchestration initialized", "info");

  let provider = null;
  try {
    provider = getProviderConfig();
    addLog(
      `Provider active: ${provider.provider} (${provider.keySource})`,
      "system"
    );
  } catch (error) {
    addLog(error.message, "error");
  }

  const entries = Object.entries(AGENTS);
  entries.forEach(([key]) => {
    setAgentStates((state) => ({
      ...state,
      [key]: { status: "running", data: null },
    }));
    addLog(`${key} activated`, "info");
  });

  addLog("Dispatching agents in parallel", "info");

  const results = await Promise.all(
    entries.map(async ([key, agent]) => {
      try {
        const activeProvider = provider || getProviderConfig();
        const response = await fetch(activeProvider.url, {
          method: "POST",
          headers: activeProvider.headers,
          body: JSON.stringify({
            model: "openai/gpt-oss-120b:free",
            messages: [
              { role: "system", content: agent.systemPrompt },
              { role: "user", content: `Startup objective: ${objective}` },
            ],
            max_tokens: 1200,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }

        const apiData = await response.json();
        const raw = apiData.choices?.[0]?.message?.content;

        if (!raw) {
          throw new Error("Missing model response content");
        }

        const parsed = safeParseJson(raw);
        if (!parsed) {
          throw new Error("Invalid JSON returned by model");
        }

        setAgentStates((state) => ({
          ...state,
          [key]: { status: "done", data: parsed },
        }));
        addLog(`${key} completed`, "success");

        return [key, parsed];
      } catch (error) {
        setAgentStates((state) => ({
          ...state,
          [key]: { status: "error", data: null },
        }));
        addLog(`${key} failed: ${error.message}`, "error");
        return [key, null];
      }
    })
  );

  const resultMap = Object.fromEntries(results);
  addLog("Synthesis done", "success");

  return {
    strategist: resultMap.strategist ?? null,
    gtm: resultMap.gtm ?? null,
    outreach: resultMap.outreach ?? null,
    risk: resultMap.risk ?? null,
  };
}

export default orchestrate;
