import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  console.log("Main: Initializing React root...");
  createRoot(document.getElementById("root")!).render(<App />);
} catch (error) {
  console.error("Main: Failed to render app:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;"><h1>Startup Error</h1><pre>${error}</pre></div>`;
}

