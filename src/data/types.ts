export interface StackLayer {
  id: string;
  name: string;
  /** Optional short title shown beside the name. */
  role?: string;
  text: string;
  art: "tiles" | "orbit" | "teams" | "cluster" | "rails";
  /** Where the layer links to, and how that link is announced. */
  href?: string;
  ariaLabel?: string;
}
