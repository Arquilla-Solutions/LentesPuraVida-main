import { defineConfig } from "astro/config";
import icon from "astro-icon";

// Static build served by Cloudflare Pages. No SSR adapter needed.
// URLs match the current React Router structure: /, /sobre-nosotros, /lentes/:slug, /404
export default defineConfig({
  site: "https://lentespuravida.com",
  trailingSlash: "never",
  build: {
    format: "file",
  },
  compressHTML: true,
  integrations: [icon()],
});
