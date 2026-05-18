import { useState } from "react";
import { Landing } from "./components/Landing";
import App from "./App";

export function AppShell() {
  const [view, setView] = useState<"landing" | "app">("landing");

  if (view === "landing") {
    return <Landing onLaunch={() => setView("app")} />;
  }

  return <App onBack={() => setView("landing")} />;
}
