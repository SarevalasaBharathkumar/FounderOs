import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_OPENAI_KEY:
      process.env.NEXT_PUBLIC_OPENAI_KEY || process.env.REACT_APP_OPENAI_KEY,
    NEXT_PUBLIC_OPENROUTER_KEY:
      process.env.NEXT_PUBLIC_OPENROUTER_KEY || process.env.REACT_APP_OPENROUTER_KEY,
  },
};

export default nextConfig;
