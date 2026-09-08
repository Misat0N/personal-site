import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: process.env.SITE_URL || "https://tianyuannie.com",
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap()],
  server: {
    host: true,
  },
});
