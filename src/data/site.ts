export const SITE = {
  name: "Digit Software",
  url: "https://digit.software",
  email: "info@digit.software",
  description: "Software for businesses that can think, operate, and improve on their own.",
  ogImage: "/assets/digit-social-v5.png",
  ogImageAlt: "Digit Software: software for businesses that can think, operate, and improve on their own.",
} as const;

/** Page titles and meta descriptions. */
export const SEO = {
  home: {
    title: "Digit Software | Software for Autonomous Business Operations",
    description:
      "Digit Software engineers intelligent software, autonomous systems, and the infrastructure behind businesses that can operate and improve with increasing independence.",
  },
  company: {
    title: "Company | Digit Software",
    description:
      "Learn how Digit Software builds technology for autonomous business operations and uses it across a portfolio of businesses it owns and manages.",
  },
  platform: {
    title: "Platform | Digit Software",
    description:
      "Explore the software Digit is building to coordinate business operations, specialized agents, execution, institutional knowledge, and human oversight.",
  },
  businesses: {
    title: "Businesses | Digit Software",
    description:
      "Explore Digit Software's portfolio across e-commerce, media, marketing, web solutions, and software development.",
  },
  technology: {
    title: "Technology | Digit Software",
    description:
      "Explore the execution, knowledge, governance, integrations, and reliability systems behind Digit's autonomous business software.",
  },
} as const;

/** Primary navigation. The wordmark is the link home. */
export const NAV = [
  { href: "/company", label: "Company" },
  { href: "/platform", label: "Platform" },
  { href: "/businesses", label: "Businesses" },
  { href: "/technology", label: "Technology" },
] as const;

export const LEGAL_NAV = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;
