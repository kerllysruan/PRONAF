import { Buffer } from "buffer";

if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}
if (typeof globalThis !== "undefined") {
  (globalThis as any).Buffer = Buffer;
  (globalThis as any).global = globalThis;
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
