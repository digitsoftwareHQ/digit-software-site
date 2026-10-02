export interface StackLayer {
  id: string;
  name: string;
  role: string;
  text: string;
  art: "tiles" | "orbit" | "teams" | "cluster" | "rails";
}
