"use client";
"use client";
import { useEffect, useRef } from "react";
import { FONTS, T } from "../styles/tokens";

const typeColor = {
  system: T.accent,
  agent: T.amber,
  success: T.green,
  error: T.red,
  info: T.accent,
};

export default function Console({ logs }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section style={{ maxWidth: 860, margin: "14px auto 0", padding: "0 16px" }}>
      <div
        ref={containerRef}
        style={{
          maxHeight: 200,
          overflowY: "auto",
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          background: T.bg,
          padding: 10,
          fontFamily: FONTS.mono,
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        {(logs || []).length === 0 ? (
          <div style={{ color: T.dim }}>No logs yet.</div>
        ) : (
          (logs || []).map((entry, index) => (
            <div key={`${entry.ts || "ts"}-${index}`} style={{ color: typeColor[entry.type] || T.dim, marginBottom: 4 }}>
              <span style={{ color: T.dim }}>{`[${entry.ts}] `}</span>
              <span>{entry.msg}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
