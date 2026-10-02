# digit.software

The public website for Digit Software. Static site built with [Astro](https://astro.build), published to GitHub Pages.

## Develop

Requires Node 22.12 or newer.

```sh
npm install
npm run dev        # http://127.0.0.1:4321 with live reload
npm run build      # static output in dist/
npm run preview    # serve dist/ locally
npm run check      # verify dist/: links, anchors, assets, metadata, no third-party loads
```

Astro telemetry is disabled in every script.

## Structure

```
src/
  pages/               index (home), company, platform, businesses, technology, privacy, terms, 404
  pages/company/journal/[slug].astro   one page per journal entry
  content/journal/     journal entries (Markdown; see _README.md there)
  layouts/             BaseLayout (head, metadata, header, footer), LegalLayout
  components/          Header, Footer
  components/home/     homepage sections
  components/shared/   pieces used on more than one page (Mission Control screen, Cerebro explorer,
                       platform stack, business emblems, page hero, contact CTA, cycle diagram)
  scripts/universe.ts  knowledge-universe renderer (hero, homepage Cerebro, Cerebro explorer)
  scripts/site.ts      header state, mobile menu, scroll reveals
  data/                site constants and navigation, businesses, the fictional Cerebro example
  styles/global.css    design tokens and shared primitives
public/                favicons, brand mark, social card, CNAME
tools/og/              source for the social card (public/assets/digit-social-v4.png)
scripts/check-site.mjs post-build checks
```

## Content rules

- Nothing on the site is live company data. Product visuals (the knowledge universe, Mission Control, the
  Cerebro example) are illustrative, built from fictional, public-safe examples.
- Describe what Digit does and what the platform enables. Keep internal system names, development status,
  milestones and private operational detail off the site.
- The journal only carries real writing. It shows an intentional empty state until the first entry exists.
- No analytics, cookies, embeds or third-party scripts. Fonts (Mona Sans, JetBrains Mono, both OFL-1.1) are
  self-hosted. `npm run check` fails the build if anything loads from another origin. If that ever changes,
  update the privacy policy in the same change.
- `src/data/site.ts` holds the site name, description, social card and navigation.

## Deploying

The previous site was plain HTML served by GitHub Pages straight from the root of `main`. This version must be
built, so publishing changes:

1. In the GitHub repository, set **Settings -> Pages -> Build and deployment -> Source** to **GitHub Actions**.
2. Merge to `main`. `.github/workflows/deploy.yml` builds, checks and publishes `dist/`.

Do step 1 before (or together with) the merge. If `main` is merged while Pages still serves the branch root,
the live site breaks, because the root no longer contains an `index.html`.

The custom domain stays `digit.software` (`public/CNAME`, plus the domain set in the Pages settings).

## Regenerating the social card

Serve the repository root (`python3 -m http.server 4400`), open `/tools/og/og-card.html` in a 1200x630
viewport at device scale 1, capture a PNG, and save it as `public/assets/digit-social-vN.png`, then update
`ogImage` in `src/data/site.ts`.
