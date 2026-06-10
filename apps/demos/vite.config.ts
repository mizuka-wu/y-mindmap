import { defineConfig, Plugin } from "vite";

const noCachePlugin = (): Plugin => ({
  name: "no-cache",
  transformIndexHtml(html) {
    const meta = `<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, proxy-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />`;
    return html.replace(/<head>/i, `<head>\n    ${meta}`);
  },
});

export default defineConfig({
  root: ".",
  base: "/y-mindmap/demos/",
  build: {
    outDir: "dist",
  },
  server: {
    port: 3001,
  },
  plugins: [noCachePlugin()],
});
