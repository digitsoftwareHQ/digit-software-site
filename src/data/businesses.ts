export interface BusinessArea {
  id: string;
  name: string;
  eyebrow: string;
  /** Short description used on the home page. */
  summary: string;
  headline: string;
  body: string[];
  areas: string[];
  hue: string;
}

export const BUSINESSES: BusinessArea[] = [
  {
    id: "e-commerce",
    name: "E-Commerce",
    eyebrow: "E-Commerce",
    summary:
      "Digital commerce businesses combining product development, research, intelligent operations, and technology-driven distribution.",
    headline: "Digital commerce built around better operations.",
    body: [
      "Our e-commerce work covers the systems behind discovering, developing, merchandising, distributing, and improving products.",
      "That can include market and industry research, customer behavior, product development, pricing, merchandising, distribution, testing, performance measurement, and the operational work around keeping a commerce business moving.",
      "Digit's technology is designed to support more of that work over time while preserving clear limits around spending, publishing, customer-facing actions, and other consequential decisions.",
      "The category is intentionally broader than any single marketplace, storefront, or sales channel.",
    ],
    areas: [
      "Market research",
      "Customer behavior",
      "Product development",
      "Merchandising",
      "Distribution",
      "Testing",
      "Performance analysis",
      "Operational improvement",
    ],
    hue: "#36c6ff",
  },
  {
    id: "media",
    name: "Media",
    eyebrow: "Media",
    summary:
      "Digital media businesses combining scalable content systems, technology-enabled production, and modern distribution.",
    headline: "Media businesses built for repeatable production and learning.",
    body: [
      "Digit's media businesses can span multiple media properties and formats without tying the company to a particular platform.",
      "The work can include research, content development, production, publishing, distribution, audience intelligence, performance analysis, and the systems needed to keep a content operation moving.",
      "Each property can develop its own audience, format, voice, and business model while sharing technology for the work underneath.",
      "What performs well becomes evidence. What fails can still produce useful information for the next decision.",
    ],
    areas: [
      "Research",
      "Content development",
      "Production",
      "Publishing",
      "Distribution",
      "Audience intelligence",
      "Performance analysis",
      "Content operations",
    ],
    hue: "#8f86ff",
  },
  {
    id: "marketing",
    name: "Marketing",
    eyebrow: "Marketing",
    summary:
      "Technology-driven marketing focused on customer acquisition, digital growth, automation, experimentation, and measurable performance.",
    headline: "Marketing built around testing and measurable results.",
    body: [
      "Digit's marketing work covers the systems behind customer acquisition, audience growth, creative production, experimentation, measurement, and ongoing optimization.",
      "Research can inform strategy. Strategy can become campaigns and creative work. Results can be measured against the original objective. Useful findings can influence what happens next.",
      "The focus stays on measurable business outcomes rather than activity for its own sake.",
    ],
    areas: [
      "Audience research",
      "Customer acquisition",
      "Creative operations",
      "Experimentation",
      "Measurement",
      "Growth strategy",
      "Automation",
      "Optimization",
    ],
    hue: "#ff7aa8",
  },
  {
    id: "web-solutions",
    name: "Web Solutions",
    eyebrow: "Web Solutions",
    summary:
      "Web development and digital infrastructure spanning websites, platforms, domains, hosting, integrations, and connected business systems.",
    headline: "The systems businesses depend on online.",
    body: [
      "Web Solutions covers the websites, applications, infrastructure, and connected services businesses use to operate online.",
      "That includes websites, web applications, domains, hosting, integrations, business systems, and the infrastructure that connects them.",
      "The work can range from public digital experiences to the systems behind them, with an emphasis on reliability, maintainability, and useful connections between software.",
    ],
    areas: [
      "Websites",
      "Web applications",
      "Domains",
      "Hosting",
      "Integrations",
      "Digital infrastructure",
      "Business systems",
      "Ongoing operations",
    ],
    hue: "#4fd8b0",
  },
  {
    id: "software-development",
    name: "Software Development",
    eyebrow: "Software Development",
    summary:
      "Software engineering spanning SaaS, intelligent applications, automation, operational platforms, and autonomous infrastructure.",
    headline: "Software built for real operations.",
    body: [
      "Software Development covers products and systems built around automation, intelligent applications, operational software, SaaS, agent-driven systems, and autonomous infrastructure.",
      "Some software supports Digit's own companies. Other products can stand on their own.",
      "The common thread is software that does useful work inside a business rather than existing only as a demonstration of the underlying technology.",
    ],
    areas: [
      "SaaS",
      "Intelligent applications",
      "Automation",
      "Operational platforms",
      "Agent-driven systems",
      "Business software",
      "Execution infrastructure",
      "Internal systems",
    ],
    hue: "#d6e2ff",
  },
];
