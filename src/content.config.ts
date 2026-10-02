import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Public journal: essays, platform notes and company news.
 * Add an entry by creating src/content/journal/<slug>.md with the frontmatter below.
 * Files starting with an underscore are ignored.
 */
const journal = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/journal" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    kind: z.enum(["Essay", "Platform", "Company"]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { journal };
