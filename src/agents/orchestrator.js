import AGENTS from "./registry";

export async function orchestrate(objective, setAgentStates, setLog) {
  const addLog = (msg, type = "info") => {
    setLog((prev) => [
      ...prev,
      { msg, type, ts: new Date().toLocaleTimeString() },
    ]);
  };

  addLog("Orchestration initialized", "info");

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
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
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

        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

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
