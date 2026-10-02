import { getCollection } from "astro:content";

/** Published journal entries, newest first. */
export async function getJournal() {
  const entries = await getCollection("journal", ({ data }) => !data.draft);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
