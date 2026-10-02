/**
 * A fictional organization's knowledge, used to explain Cerebro on the public site.
 * Every record is invented for illustration and describes no real result.
 */

export interface ExampleRecord {
  id: string;
  cls: "knowledge" | "evidence" | "experience" | "procedures" | "organization" | "governance";
  title: string;
  overview: string;
  status: string;
  source: string;
  confidence?: string;
}

export interface ExampleRelation {
  from: string;
  to: string;
  type: string;
}

export const RECORDS: ExampleRecord[] = [
  {
    id: "k-briefing",
    cls: "knowledge",
    title: "Weekly briefings get acted on; daily ones don't",
    overview:
      "Across two briefing formats, the owner acted on far more of the weekly items. Daily briefings were mostly skimmed.",
    status: "Current",
    source: "Operations review",
    confidence: "High",
  },
  {
    id: "e-formats",
    cls: "evidence",
    title: "Response to two briefing formats, eight weeks",
    overview: "Which briefing items led to a decision, side by side for the two formats, recorded as observed.",
    status: "Complete",
    source: "Experiment record",
  },
  {
    id: "x-ignored",
    cls: "experience",
    title: "A daily report went unread for a month",
    overview: "A detailed daily report was produced on time every day and rarely opened. Nothing was wrong with it except its timing.",
    status: "Closed",
    source: "Operations log",
  },
  {
    id: "p-briefing",
    cls: "procedures",
    title: "Owner briefing, weekly format v3",
    overview: "How the weekly briefing is assembled: decisions first, then exceptions, then everything else. Version 3 replaced the daily report.",
    status: "Active",
    source: "Operations manager",
  },
  {
    id: "p-briefing-v2",
    cls: "procedures",
    title: "Owner briefing, daily format v2",
    overview: "The earlier daily format. Kept on the record, marked as superseded by version 3.",
    status: "Superseded",
    source: "Operations manager",
  },
  {
    id: "k-season",
    cls: "knowledge",
    title: "Supplier lead times stretch before holidays",
    overview: "Lead times grow by roughly a third in the weeks before major holidays, and the effect is consistent across suppliers.",
    status: "Current",
    source: "Commerce · supplier review",
    confidence: "Moderate",
  },
  {
    id: "e-deliveries",
    cls: "evidence",
    title: "Supplier delivery records, two years",
    overview: "Order and delivery dates by supplier. Gaps in the records are kept as gaps, never estimated.",
    status: "Complete",
    source: "Supplier records",
  },
  {
    id: "p-reorder",
    cls: "procedures",
    title: "Reorder timing, version 2",
    overview: "Orders placed ahead of a holiday now allow for longer lead times.",
    status: "Active",
    source: "Commerce manager",
  },
  {
    id: "k-explainers",
    cls: "knowledge",
    title: "Short explainers hold attention longer",
    overview: "Shorter explainers kept a larger share of viewers to the end than longer cuts of the same material.",
    status: "Current",
    source: "Media · audience review",
    confidence: "Moderate",
  },
  {
    id: "e-retention",
    cls: "evidence",
    title: "Audience retention across forty videos",
    overview: "Watch-through by length and structure for forty published pieces.",
    status: "Complete",
    source: "Channel analytics",
  },
  {
    id: "p-structure",
    cls: "procedures",
    title: "Explainer structure guide, v2",
    overview: "The structure every explainer follows, revised after the retention review.",
    status: "Active",
    source: "Media manager",
  },
  {
    id: "o-ops",
    cls: "organization",
    title: "Operations manager",
    overview: "Owns reporting, scheduling and how work moves between teams.",
    status: "Active role",
    source: "Organization",
  },
  {
    id: "o-commerce",
    cls: "organization",
    title: "Commerce manager",
    overview: "Owns purchasing, listings and pricing for the commerce business.",
    status: "Active role",
    source: "Organization",
  },
  {
    id: "o-media",
    cls: "organization",
    title: "Media manager",
    overview: "Owns research, production and publishing for the media properties.",
    status: "Active role",
    source: "Organization",
  },
  {
    id: "g-publish",
    cls: "governance",
    title: "Nothing is published without owner review",
    overview: "Anything public waits for the owner's explicit approval of that specific piece.",
    status: "In force",
    source: "Owner decision",
  },
  {
    id: "g-spend",
    cls: "governance",
    title: "Spending above set limits needs approval",
    overview: "Managers can commit spending within a defined range. Anything beyond it goes to the owner.",
    status: "In force",
    source: "Owner decision",
  },
];

export const RELATIONS: ExampleRelation[] = [
  { from: "e-formats", to: "k-briefing", type: "supports" },
  { from: "x-ignored", to: "k-briefing", type: "informed" },
  { from: "k-briefing", to: "p-briefing", type: "changed" },
  { from: "p-briefing", to: "p-briefing-v2", type: "supersedes" },
  { from: "p-briefing", to: "o-ops", type: "owned by" },
  { from: "e-deliveries", to: "k-season", type: "supports" },
  { from: "k-season", to: "p-reorder", type: "changed" },
  { from: "p-reorder", to: "o-commerce", type: "owned by" },
  { from: "g-spend", to: "o-commerce", type: "governs" },
  { from: "e-retention", to: "k-explainers", type: "supports" },
  { from: "k-explainers", to: "p-structure", type: "changed" },
  { from: "p-structure", to: "o-media", type: "owned by" },
  { from: "g-publish", to: "o-media", type: "governs" },
  { from: "k-explainers", to: "k-briefing", type: "related to" },
  { from: "o-commerce", to: "o-ops", type: "works with" },
  { from: "o-media", to: "o-ops", type: "works with" },
];

export const CLASS_INFO: Record<ExampleRecord["cls"], { name: string; blurb: string }> = {
  knowledge: { name: "Knowledge", blurb: "What the company holds to be true, and how confident it is." },
  evidence: { name: "Evidence", blurb: "The results, records and experiments behind it." },
  experience: { name: "Experience", blurb: "What happened when the company tried something." },
  procedures: { name: "Procedures", blurb: "How the work is done now, and what changed it." },
  organization: { name: "Organization", blurb: "Who is responsible for what." },
  governance: { name: "Governance", blurb: "What is allowed, and who decides." },
};

/** Short, fictional examples used by the hero and the homepage Cerebro visual. */
export const FOCUS_LABELS = [
  { cls: "knowledge", title: "Weekly briefings get acted on; daily ones don't" },
  { cls: "knowledge", title: "Supplier lead times stretch before holidays" },
  { cls: "knowledge", title: "Short explainers hold attention longer" },
  { cls: "evidence", title: "Delivery records, two years" },
  { cls: "evidence", title: "Retention across forty videos" },
  { cls: "evidence", title: "Campaign test: two audiences, four weeks" },
  { cls: "experience", title: "A daily report went unread for a month" },
  { cls: "experience", title: "A rushed price change was reversed" },
  { cls: "procedures", title: "Owner briefing, weekly format v3" },
  { cls: "procedures", title: "Reorder timing, version 2" },
  { cls: "procedures", title: "Explainer structure guide, v2" },
  { cls: "organization", title: "Operations manager owns reporting" },
  { cls: "organization", title: "Research agent works for media and commerce" },
  { cls: "governance", title: "Spending above set limits needs approval" },
  { cls: "governance", title: "Nothing is published without review" },
] as const;
