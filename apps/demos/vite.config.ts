import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "/y-mindmap/demos/",
  build: {
    outDir: "dist",
  },
  server: {
    port: 3001,
  },
});
