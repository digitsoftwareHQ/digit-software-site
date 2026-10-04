export const SITE = {
  name: "Digit Software",
  url: "https://digit.software",
  email: "info@digit.software",
  ogImage: "/assets/digit-social-v6.png",
  ogImageAlt: "Digit Software: software for businesses that can think, operate, and improve on their own.",
} as const;

/** Page titles and meta descriptions. */
export const SEO = {
  home: {
    title: "Digit | Engineering the Infrastructure of the Future",
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

/**
 * Primary navigation, used by the header (desktop and mobile) and the footer. The wordmark is the link home.
 * Labels live in content/global.json under "nav". Contact Us leads to the contact section on the home page;
 * there is no separate contact page.
 */
export const NAV = [
  { href: "/company", key: "company" },
  { href: "/businesses", key: "businesses" },
  { href: "/platform", key: "platform" },
  { href: "/technology", key: "technology" },
  { href: "/#contact", key: "contact" },
] as const;

/** Legal links in the footer. Labels live in content/global.json under "footer". */
export const LEGAL_NAV = [
  { href: "/privacy", key: "privacy" },
  { href: "/terms", key: "terms" },
] as const;
