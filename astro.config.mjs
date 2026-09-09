import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

const site =
  process.env.SITE_URL ||
  "https://personal-site.1269410637.workers.dev";

export default defineConfig({
  site,
  output: "server",
  session: false,
  adapter: cloudflare({
    imageService: "passthrough",
    platformProxy: {
      enabled: true,
    },
  }),
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return !path.startsWith("/admin") && !path.startsWith("/api");
      },
      customPages: ["zh", "en", "ja"].map((locale) => new URL(`/${locale}/`, site).href),
    }),
  ],
  server: {
    host: "127.0.0.1",
  },
});
