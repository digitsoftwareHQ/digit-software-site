/** Site-wide behavior: header state, mobile menu, scroll reveals. */

const header = document.querySelector<HTMLElement>("[data-header]");

// Header turns to glass once the page leaves the top (home only; other pages start as glass).
if (header && header.dataset.variant === "home") {
  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

// Mobile menu: a full-height panel; Escape closes it and focus returns to the toggle.
const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
const menu = document.querySelector<HTMLElement>("[data-mobile-menu]");
const toggleLabel = document.querySelector<HTMLElement>("[data-menu-label]");
if (toggle && menu) {
  const setOpen = (open: boolean, restoreFocus = false) => {
    toggle.setAttribute("aria-expanded", String(open));
    if (toggleLabel) toggleLabel.textContent = open ? "Close menu" : "Open menu";
    menu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) menu.querySelector<HTMLAnchorElement>("a")?.focus();
    else if (restoreFocus) toggle.focus();
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => {
    if ((e.target as Element).closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setOpen(false, true);
  });
  // Keep focus inside the open menu (toggle + links).
  document.addEventListener("focusin", (e) => {
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    const t = e.target as Node;
    if (!menu.contains(t) && t !== toggle) menu.querySelector<HTMLAnchorElement>("a")?.focus();
  });
  window.matchMedia("(min-width: 861px)").addEventListener("change", (m) => m.matches && setOpen(false));
}

// Scroll reveals.
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reveals = document.querySelectorAll<HTMLElement>(".reveal");
if (reduce || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("is-in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
  );
  reveals.forEach((el) => io.observe(el));
}
