import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { remarkRewriteLinks } from "./src/remark-rewrite-links.mjs";

export default defineConfig({
  site: "https://funkyposts.dev",
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkRewriteLinks],
  },
});
