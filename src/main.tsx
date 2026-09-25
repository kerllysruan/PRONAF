import { Buffer } from "buffer";

if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}
if (typeof globalThis !== "undefined") {
  (globalThis as any).Buffer = Buffer;
  (globalThis as any).global = globalThis;
}
// Auto-reload on deployment chunk update errors (stale hash recovery)
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    console.warn("Vite preload error: chunk desatualizado pós-deploy. Recarregando página...", event);
    window.location.reload();
  });
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
