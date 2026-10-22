import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: { assetsInlineLimit: 0 },
  server: { proxy: { "/access.php": { target: "http://127.0.0.1:5175" } } },
});
