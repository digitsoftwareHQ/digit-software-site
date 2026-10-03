// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import ownerEdit from "./integrations/owner-edit/index.mjs";

// Static output for GitHub Pages. `build.format: "file"` keeps the long-standing
// public URLs (/privacy.html, /terms.html) exactly as they were before the redesign.
export default defineConfig({
  site: "https://digit.software",
  output: "static",
  trailingSlash: "ignore",
  build: { format: "file", inlineStylesheets: "auto" },
  // ownerEdit() only does anything under `astro dev` (local Owner Editing Mode); production builds get nothing.
  integrations: [ownerEdit(), sitemap({ filter: (page) => !page.endsWith("/404") && !page.endsWith("/404.html") })],
  devToolbar: { enabled: false },
});
