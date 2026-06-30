import { defineConfig } from "astro/config";
import { remarkRewriteLinks } from "./src/remark-rewrite-links.mjs";

export default defineConfig({
  site: "https://funkyposts.dev",
  markdown: {
    remarkPlugins: [remarkRewriteLinks],
  },
});
