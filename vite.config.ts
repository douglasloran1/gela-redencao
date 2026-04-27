import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 4596,
    hmr: { overlay: false },
    proxy: {
      "/supabase-storage": {
        target: "https://vxrjwhfgsyzdlsvneicr.supabase.co",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-storage/, ""),
        secure: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
});
