export const SITE = {
  name: "Digit Software",
  url: "https://digit.software",
  email: "info@digit.software",
  tagline: "Software for companies that run themselves",
  ogTitle: "Software for companies that run themselves, and get better at it.",
  description:
    "Digit Software builds software that helps businesses think, operate and improve on their own, with people in control of the decisions that matter.",
  ogImage: "/assets/digit-social-v4.png",
  ogImageAlt: "Digit Software: software for companies that run themselves, and get better at it.",
} as const;

/** Primary navigation. The wordmark is the link home. */
export const NAV = [
  { href: "/company", label: "Company" },
  { href: "/platform", label: "Platform" },
  { href: "/businesses", label: "Businesses" },
  { href: "/technology", label: "Technology" },
] as const;

export const FOOTER_NAV = [
  {
    title: "Platform",
    href: "/platform",
    links: [
      { href: "/platform#overview", label: "Overview" },
      { href: "/platform#neo", label: "Neo" },
      { href: "/platform#mission-control", label: "Mission Control" },
      { href: "/platform#cerebro", label: "Cerebro" },
    ],
  },
  {
    title: "Company",
    href: "/company",
    links: [
      { href: "/company#about", label: "About" },
      { href: "/company#vision", label: "Vision" },
      { href: "/company#journal", label: "Journal" },
      { href: "/company#contact", label: "Contact" },
    ],
  },
  {
    title: "Businesses",
    href: "/businesses",
    links: [
      { href: "/businesses#portfolio", label: "Portfolio" },
      { href: "/businesses#e-commerce", label: "E-Commerce" },
      { href: "/businesses#media", label: "Media" },
      { href: "/businesses#marketing", label: "Marketing" },
      { href: "/businesses#web-solutions", label: "Web Solutions" },
      { href: "/businesses#software-development", label: "Software Development" },
    ],
  },
  {
    title: "Technology",
    href: "/technology",
    links: [
      { href: "/technology#architecture", label: "Architecture" },
      { href: "/technology#execution", label: "Execution" },
      { href: "/technology#agents", label: "Agents" },
      { href: "/technology#knowledge", label: "Knowledge & learning" },
      { href: "/technology#governance", label: "Governance" },
      { href: "/technology#integrations", label: "Integrations" },
      { href: "/technology#reliability", label: "Reliability" },
    ],
  },
  {
    title: "Legal",
    href: "/privacy",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;
