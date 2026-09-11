import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    testTimeout: 5000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
  },
});
