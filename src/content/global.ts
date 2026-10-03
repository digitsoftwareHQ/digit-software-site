import data from "./global.json";
import { fields } from "./schema";

/** Copy shared across pages: navigation, footer, the contact band, the cycle diagram, and the 404 page. Edit global.json, or use Owner Editing Mode (see README). */
export const globalCopy = fields("global", data);
