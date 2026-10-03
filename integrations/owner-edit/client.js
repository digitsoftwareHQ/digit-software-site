// Owner Editing Mode loader. Injected into pages by `astro dev` only. OWNER_EDIT_CLIENT
// Without ?edit in the address (or an editing session already started in this tab) it does nothing at all.
const FLAG = "digit-owner-edit";
const asked = new URLSearchParams(location.search).has("edit");
let on = asked;
try {
  if (asked) sessionStorage.setItem(FLAG, "on");
  on = sessionStorage.getItem(FLAG) === "on";
} catch {
  // Storage unavailable: editing lasts for this page only.
}
if (on) import("./editor.js");
