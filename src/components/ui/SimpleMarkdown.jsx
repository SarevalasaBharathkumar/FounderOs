"use client";

import React from "react";

function renderInline(text) {
  const parts = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={`b-${key++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code key={`c-${key++}`} style={{ background: "rgba(255,255,255,0.08)", padding: "1px 4px", borderRadius: 4 }}>
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={`i-${key++}`}>{token.slice(1, -1)}</em>);
    } else {
      parts.push(token);
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function parseTable(lines, start) {
  const rows = [];
  let index = start;
  while (index < lines.length && lines[index].includes("|")) {
    rows.push(lines[index]);
    index += 1;
  }
  if (rows.length < 2 || !/^[-|\s:]+$/.test(rows[1].replace(/\|/g, "").trim())) {
    return null;
  }

  const splitRow = (row) =>
    row
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell, i, arr) => !(i === 0 && cell === "") && !(i === arr.length - 1 && cell === ""));

  const headers = splitRow(rows[0]);
  const bodyRows = rows.slice(2).map(splitRow);
  return { headers, bodyRows, nextIndex: index };
}

export default function SimpleMarkdown({ text }) {
  const lines = String(text || "").split("\n");
  const nodes = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      nodes.push(<div key={`gap-${i}`} style={{ height: 8 }} />);
      continue;
    }

    const table = parseTable(lines, i);
    if (table) {
      nodes.push(
        <div key={`table-${i}`} style={{ overflowX: "auto", margin: "10px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr>
                {table.headers.map((header, idx) => (
                  <th key={`h-${idx}`} style={{ border: "1px solid rgba(255,255,255,0.15)", padding: "8px 10px", textAlign: "left", color: "#ffffff", background: "rgba(255,255,255,0.06)" }}>
                    {renderInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.bodyRows.map((row, rIdx) => (
                <tr key={`r-${rIdx}`}>
                  {row.map((cell, cIdx) => (
                    <td key={`c-${rIdx}-${cIdx}`} style={{ border: "1px solid rgba(255,255,255,0.12)", padding: "8px 10px", color: "#e4e4e7", verticalAlign: "top" }}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = table.nextIndex - 1;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      nodes.push(
        <div key={`h3-${i}`} style={{ color: "#ffffff", fontWeight: 700, marginTop: 10 }}>
          {renderInline(trimmed.slice(4))}
        </div>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      nodes.push(
        <div key={`h2-${i}`} style={{ color: "#ffffff", fontSize: "1.02rem", fontWeight: 700, marginTop: 12 }}>
          {renderInline(trimmed.slice(3))}
        </div>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      nodes.push(
        <div key={`h1-${i}`} style={{ color: "#ffffff", fontSize: "1.12rem", fontWeight: 800, marginTop: 12 }}>
          {renderInline(trimmed.slice(2))}
        </div>
      );
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      nodes.push(
        <div key={`n-${i}`} style={{ color: "#e4e4e7", lineHeight: 1.65 }}>
          {renderInline(trimmed)}
        </div>
      );
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      nodes.push(
        <div key={`b-${i}`} style={{ color: "#d4d4d8", marginLeft: 8, lineHeight: 1.65 }}>
          {"• "}
          {renderInline(trimmed.replace(/^[-*]\s+/, ""))}
        </div>
      );
      continue;
    }

    nodes.push(
      <div key={`p-${i}`} style={{ color: "#e4e4e7", lineHeight: 1.65 }}>
        {renderInline(trimmed)}
      </div>
    );
  }

  return <>{nodes}</>;
}

