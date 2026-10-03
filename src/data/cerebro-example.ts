/**
 * Illustrative Cerebro content for the public site. Records are generic examples of the kinds of
 * company knowledge Cerebro connects. They describe no real record and no real result.
 *
 * `cls` is the colour family used by the knowledge-universe renderer (scripts/universe.ts).
 */

export type KindClass = "knowledge" | "evidence" | "experience" | "procedures" | "organization" | "governance";

export interface Kind {
  cls: KindClass;
}

/** The six kinds of knowledge shown in the Platform page's Cerebro section, in display order. Their names and
 * descriptions are page copy in content/platform.json ("cerebro.kinds"), keyed by class. */
export const KINDS: Kind[] = [
  { cls: "knowledge" },
  { cls: "evidence" },
  { cls: "governance" },
  { cls: "procedures" },
  { cls: "organization" },
  { cls: "experience" },
];

export interface Related {
  label: string;
  /** id of the example record this relates to, when there is one */
  ref?: string;
}

export interface ExampleRecord {
  id: string;
  type: string;
  cls: KindClass;
  title: string;
  summary: string;
  related: Related[];
}

export const RECORDS: ExampleRecord[] = [
  {
    id: "r01",
    type: "Research",
    cls: "knowledge",
    title: "Customer demand analysis",
    summary: "Research used to understand what customers are looking for and where demand is changing.",
    related: [{ label: "Evidence", ref: "r02" }, { label: "Product Strategy" }, { label: "Market Signals", ref: "r02" }],
  },
  {
    id: "r02",
    type: "Evidence",
    cls: "evidence",
    title: "Market signal",
    summary: "A piece of evidence that supports or challenges an existing assumption.",
    related: [{ label: "Research", ref: "r01" }, { label: "Experiment", ref: "r05" }, { label: "Decision", ref: "r03" }],
  },
  {
    id: "r03",
    type: "Decision",
    cls: "governance",
    title: "Product direction",
    summary: "A recorded business decision with the evidence and context that informed it.",
    related: [{ label: "Evidence", ref: "r02" }, { label: "Strategy" }, { label: "Product Knowledge" }],
  },
  {
    id: "r04",
    type: "Procedure",
    cls: "procedures",
    title: "Quality review",
    summary: "A repeatable process used to review work before it moves forward.",
    related: [{ label: "Product Knowledge" }, { label: "Standards" }, { label: "Learning", ref: "r08" }],
  },
  {
    id: "r05",
    type: "Learning",
    cls: "experience",
    title: "Experiment result",
    summary: "A result that changes what the business knows about a product, process, or market.",
    related: [{ label: "Experiment" }, { label: "Evidence", ref: "r02" }, { label: "Procedure", ref: "r04" }],
  },
  {
    id: "r06",
    type: "Organization",
    cls: "organization",
    title: "Business objective",
    summary: "Context about what a business is trying to accomplish and why it matters.",
    related: [{ label: "Strategy" }, { label: "Work" }, { label: "Decision", ref: "r03" }],
  },
  {
    id: "r07",
    type: "Knowledge",
    cls: "knowledge",
    title: "Customer behavior",
    summary: "Reusable knowledge about how customers respond to products, offers, or experiences.",
    related: [{ label: "Research", ref: "r01" }, { label: "Marketing" }, { label: "Product Strategy" }],
  },
  {
    id: "r08",
    type: "Learning",
    cls: "experience",
    title: "Operational lesson",
    summary: "Something learned through real work that can improve how similar work is handled next time.",
    related: [{ label: "Procedure", ref: "r04" }, { label: "Operations" }, { label: "Evidence", ref: "r02" }],
  },
];

/** Tooltip labels for the home hero's knowledge universe: the same illustrative records. */
export const FOCUS_LABELS = RECORDS.map((r) => ({ cls: r.cls, kind: r.type, title: r.title }));
