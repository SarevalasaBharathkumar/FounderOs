"use client";
import dynamic from "next/dynamic";

const App = dynamic(() => import("../src/App"), {
  ssr: false,
  loading: () => <div style={{ background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading...</div>,
});

export default function Page() {
  return <App />;
}
