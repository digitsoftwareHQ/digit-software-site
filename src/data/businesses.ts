export interface BusinessArea {
  id: string;
  name: string;
  line: string;
  body: string;
  work: string[];
  hue: string;
}

export const BUSINESSES: BusinessArea[] = [
  {
    id: "e-commerce",
    name: "E-Commerce",
    line: "Digital commerce, online products and marketplace operations.",
    body: "Commerce rewards close attention at a pace people find hard to sustain: research, listings, pricing, customer questions and a steady stream of small adjustments. That makes it well suited to agents working continuously, with the owner deciding anything that commits money or reputation.",
    work: ["Product research and development", "Catalog and listing operations", "Pricing within set limits", "Performance review and follow-up"],
    hue: "#36c6ff",
  },
  {
    id: "media",
    name: "Media",
    line: "Digital media, content and virtual properties.",
    body: "Media runs on a cycle of research, production, publishing and learning what an audience responds to. The platform is built to keep that cycle moving, keep each property true to its own voice and rules, and route anything public to the owner for review.",
    work: ["Research and story development", "Content production pipelines", "Character and brand consistency", "Audience insight"],
    hue: "#8f86ff",
  },
  {
    id: "marketing",
    name: "Marketing",
    line: "Marketing systems, campaigns and growth.",
    body: "Good marketing is a loop of ideas, experiments and evidence, which is the loop the platform is designed around: plan, run, measure honestly, and let the results shape the next round, within the budgets and boundaries the owner sets.",
    work: ["Campaign planning and execution", "Experiments and measurement", "Search and content strategy", "Reporting that leads to decisions"],
    hue: "#ff7aa8",
  },
  {
    id: "web-solutions",
    name: "Web Solutions",
    line: "Websites, digital infrastructure and online operations.",
    body: "Websites and the systems behind them need steady care: building, publishing, monitoring and keeping everything current. It is operational work with clear standards, which makes it a natural fit for governed automation.",
    work: ["Website design and build", "Domains, hosting and infrastructure", "Monitoring and maintenance", "Online operations"],
    hue: "#4fd8b0",
  },
  {
    id: "software-development",
    name: "Software Development",
    line: "Software products, internal systems and tools.",
    body: "Digit builds the products, internal systems and tools that make autonomous operation practical. What the other businesses need shapes what gets built here, and what gets built here strengthens all of them.",
    work: ["Software products", "Internal systems and tooling", "Integrations and automation", "The technology behind Digit"],
    hue: "#d6e2ff",
  },
];
