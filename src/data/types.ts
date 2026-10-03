import type { Field } from "../content/schema";

export interface StackLayer {
  id: string;
  name: Field;
  /** Optional short title shown beside the name. */
  role?: Field;
  body: Field;
  art: "tiles" | "orbit" | "teams" | "cluster" | "rails";
  /** Where the layer links to, and how that link is announced. */
  href?: string;
  ariaLabel?: string;
}
