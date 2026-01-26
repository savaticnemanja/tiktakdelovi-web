import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/logs": "http://localhost:4000"
    }
  }
});
