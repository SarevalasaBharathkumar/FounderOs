"use client";

import ActionButton from "../ActionButton";
import callOpenRouter from "../../../lib/openrouter";

function GenerateICPSheetButton({ data, objective }) {
  const handleClick = async () => {
    const response = await callOpenRouter({
      systemPrompt:
        "You are a B2B sales expert. Generate a CSV-formatted Ideal Customer Profile scoring sheet. Return ONLY raw CSV data, no explanation, no markdown, no code fences. Just the CSV.",
      userMessage: `
Startup objective: ${objective}
Target segments: ${JSON.stringify(data?.targetSegments)}
Channels: ${JSON.stringify(data?.channels)}

Generate a CSV with these exact columns:
Company Name, Industry, Company Size, Annual Revenue, 
Has Budget (Y/N), Decision Maker Access (Y/N), 
Urgency Score (1-10), ${data?.targetSegments?.[0]?.pain?.slice(0, 30)} Score (1-10),
Channel Fit (${data?.channels?.[0]?.name}), Total ICP Score

Include 10 example rows with realistic placeholder data 
matching the target segment: ${data?.targetSegments?.[0]?.segment}
Add a final row with Excel/Sheets AVERAGE formula for numeric columns.
`,
    });

    const csvText = typeof response === "string" ? response : response?.content || "";
    const blob = new Blob([csvText], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "icp-scoring-sheet.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return <ActionButton icon="??" label="Download ICP Sheet" doneLabel="Downloaded!" onClick={handleClick} />;
}

export default GenerateICPSheetButton;
