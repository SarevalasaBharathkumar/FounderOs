"use client";
import HeroSection from "./HeroSection";
import HowItWorks from "./HowItWorks";
import FeaturesSection from "./FeaturesSection";
import CTASection from "./CTASection";

export default function LandingPage({ onLaunch }) {
  return (
    <div
      style={{
        background: "#000000",
        overflowX: "hidden",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Hero Section */}
      <HeroSection onLaunch={onLaunch} />

      {/* How It Works */}
      <HowItWorks />

      {/* Features Section */}
      <FeaturesSection />

      {/* CTA Section */}
      <CTASection onGetStarted={() => onLaunch("")} />

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          background: "#000000",
        }}
      >
        {/* Left: Branding */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
          <span
            style={{
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 700,
              color: "#ffffff",
              fontSize: "1rem",
            }}
          >
            FounderOS
          </span>
          <span
            style={{
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              color: "#52525b",
              fontSize: "0.8rem",
              fontWeight: 400,
            }}
          >
            AI COO Platform
          </span>
        </div>

        {/* Right: Hackathon Credit */}
        <span
          style={{
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            color: "#52525b",
            fontSize: "0.75rem",
            fontWeight: 400,
          }}
        >
          Built for the OpenAI Hackathon 2025
        </span>
      </footer>
    </div>
  );
}
