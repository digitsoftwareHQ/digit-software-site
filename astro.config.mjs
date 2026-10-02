// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static output for GitHub Pages. `build.format: "file"` keeps the long-standing
// public URLs (/privacy.html, /terms.html) exactly as they were before the redesign.
export default defineConfig({
  site: "https://digit.software",
  output: "static",
  trailingSlash: "ignore",
  build: { format: "file", inlineStylesheets: "auto" },
  integrations: [sitemap({ filter: (page) => !page.endsWith("/404") && !page.endsWith("/404.html") })],
  devToolbar: { enabled: false },
});
