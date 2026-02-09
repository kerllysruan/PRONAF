import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Middleware para redirecionar rotas para index.html (SPA)
const spaFallback = () => ({
  name: 'spa-fallback',
  configureServer(server: any) {
    return () => {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.includes('.')) {
          req.url = '/index.html';
        }
        next();
      });
    };
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    middlewareMode: false,
  },
  preview: {
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), spaFallback()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
