import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:8000",
      NEXT_PUBLIC_DEFAULT_LOCALE: "he",
      NEXT_PUBLIC_MAX_UPLOAD_MB: "10",
      NEXT_PUBLIC_ALLOWED_MIME: "image/jpeg,image/png,image/webp",
    },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./") } },
});
