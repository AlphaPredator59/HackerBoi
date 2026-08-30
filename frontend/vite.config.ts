import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@designcodeio/threeui/style.css": path.resolve(__dirname, "src/shaders/threeui.css"),
      "@designcodeio/threeui": path.resolve(__dirname, "src/threeui.ts"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3000,
  },
  preview: {
    host: "127.0.0.1",
    port: 3000,
  },
});
