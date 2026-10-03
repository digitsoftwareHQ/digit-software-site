/**
 * The portfolio areas, in display order. Each id is the anchor on /businesses and the key for its copy:
 * the home page card lives in content/home.json ("businesses.cards") and the full section in content/businesses.json
 * ("areas").
 */
export const BUSINESSES = [
  { id: "e-commerce", hue: "#36c6ff" },
  { id: "media", hue: "#8f86ff" },
  { id: "marketing", hue: "#ff7aa8" },
  { id: "web-solutions", hue: "#4fd8b0" },
  { id: "software-development", hue: "#d6e2ff" },
] as const;
