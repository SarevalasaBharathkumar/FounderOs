"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import ActionButton from "../ActionButton";

function DeployToVercelButton({ html, startupName }) {
  const [showModal, setShowModal] = useState(false);
  const [token, setToken] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState(null);
  const [error, setError] = useState(null);

  async function handleDeploy() {
    if (!token.trim()) return;
    setDeploying(true);
    setError(null);

    try {
      const encodedHtml = btoa(unescape(encodeURIComponent(html || "")));

      const response = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: startupName || "my-startup",
          files: [
            {
              file: "index.html",
              data: encodedHtml,
              encoding: "base64",
            },
          ],
          projectSettings: { framework: null },
          target: "production",
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error.message || "Deployment failed. Check your token.");
        return;
      }

      const deploymentId = data.id;
      let liveUrl = null;
      let attempts = 0;

      while (attempts < 20) {
        await new Promise((r) => setTimeout(r, 2000));
        const check = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const status = await check.json();

        if (status.readyState === "READY") {
          liveUrl = `https://${status.url}`;
          break;
        }
        if (status.readyState === "ERROR") {
          setError("Deployment failed during build.");
          return;
        }
        attempts++;
      }

      if (liveUrl) {
        setDeployedUrl(liveUrl);
        const deploys = JSON.parse(localStorage.getItem("founderos-deploys") || "[]");
        deploys.unshift({ url: liveUrl, ts: Date.now(), name: startupName });
        localStorage.setItem("founderos-deploys", JSON.stringify(deploys.slice(0, 10)));
      } else {
        setError("Deployment timed out. Check your Vercel dashboard.");
      }
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setDeploying(false);
    }
  }

  return (
    <>
      <ActionButton icon="▲" label="Deploy to Vercel" onClick={() => setShowModal(true)} variant="primary" />

      {showModal &&
        typeof document !== "undefined" &&
        createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483647,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "16px",
          }}
        >
          <style>{`
            @keyframes vercelSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>

          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "2rem",
              maxWidth: "480px",
              width: "90%",
              color: "white",
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {deployedUrl ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: "1.3rem", color: "white", marginBottom: "1rem" }}>Your startup is live!</div>
                <div
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: "0.85rem",
                    color: "#818cf8",
                    marginBottom: "1rem",
                    wordBreak: "break-all",
                  }}
                >
                  {deployedUrl}
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "0.75rem" }}>
                  <button type="button" onClick={() => window.open(deployedUrl, "_blank")} style={pillButtonStyle}>
                    🔗 Open Site
                  </button>
                  <button type="button" onClick={() => navigator.clipboard.writeText(deployedUrl)} style={pillButtonStyle}>
                    📋 Copy URL
                  </button>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#52525b", textAlign: "center", marginTop: "0.75rem", marginBottom: "1rem" }}>
                  ✏️ Want to update it? Close this and click Edit &amp; Redeploy
                </div>
                <button type="button" onClick={() => setShowModal(false)} style={ghostButtonStyle}>
                  Close
                </button>
              </div>
            ) : deploying ? (
              <div style={{ display: "grid", placeItems: "center", textAlign: "center", padding: "1rem 0" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid rgba(99,102,241,0.2)",
                    borderTopColor: "#6366f1",
                    borderRadius: "50%",
                    animation: "vercelSpin 1s linear infinite",
                    marginBottom: "1rem",
                  }}
                />
                <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>Deploying to Vercel...</div>
                <div style={{ fontSize: "0.8rem", color: "#71717a" }}>This takes about 15–30 seconds</div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "white", marginBottom: "0.35rem" }}>Deploy to Vercel</div>
                <div style={{ fontSize: "0.8rem", color: "#71717a", marginBottom: "1.5rem" }}>
                  Your landing page will get a live public URL
                </div>

                <div style={stepBoxStyle}>
                  <div style={{ fontSize: "0.86rem", fontWeight: 600, marginBottom: "0.35rem" }}>1. Get your free Vercel token</div>
                  <button
                    type="button"
                    onClick={() => window.open("https://vercel.com/account/tokens", "_blank")}
                    style={{
                      color: "#818cf8",
                      fontSize: "0.8rem",
                      textDecoration: "none",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    vercel.com/account/tokens →
                  </button>
                  <div style={{ fontSize: "0.72rem", color: "#52525b", marginTop: "0.3rem" }}>Free account · No credit card needed</div>
                </div>

                <div style={{ ...stepBoxStyle, marginTop: "1rem" }}>
                  <div style={{ fontSize: "0.86rem", fontWeight: 600, marginBottom: "0.5rem" }}>2. Paste your token</div>
                  <input
                    type="password"
                    placeholder="tok_..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      color: "white",
                      fontSize: "0.85rem",
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                      width: "100%",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.border = "1px solid rgba(99,102,241,0.5)";
                    }}
                    onBlur={(e) => {
                      e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                    }}
                  />
                </div>

                {error ? (
                  <div
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      marginTop: "0.75rem",
                      fontSize: "0.78rem",
                      color: "#f87171",
                    }}
                  >
                    {error}
                  </div>
                ) : null}

                <div style={{ marginTop: "1.5rem", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={handleDeploy}
                    disabled={!token.trim()}
                    style={{
                      ...whiteButtonStyle,
                      opacity: token.trim() ? 1 : 0.5,
                      cursor: token.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    🚀 Deploy Now
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} style={ghostButtonStyle}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      , document.body)}
    </>
  );
}

const stepBoxStyle = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "12px",
  background: "rgba(255,255,255,0.02)",
};

const pillButtonStyle = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  borderRadius: "999px",
  padding: "8px 14px",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: "0.8rem",
  cursor: "pointer",
};

const whiteButtonStyle = {
  border: "1px solid white",
  background: "white",
  color: "black",
  borderRadius: "999px",
  padding: "8px 14px",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: "0.8rem",
};

const ghostButtonStyle = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "transparent",
  color: "white",
  borderRadius: "999px",
  padding: "8px 14px",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: "0.8rem",
  cursor: "pointer",
};

export default DeployToVercelButton;
