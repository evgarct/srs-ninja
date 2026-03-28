# Echo — Branding

## Goal

Brand-facing metadata, product naming, MCP naming, and app icon assets are driven from one source of truth so future rebrands are low-friction.

## Single Source

- Root config: [`brand.config.json`](../brand.config.json)
- Runtime helpers: [`src/lib/brand.ts`](../src/lib/brand.ts)

`brand.config.json` contains:

- app name and short name
- tagline / default description
- theme and background colors
- canonical icon paths
- MCP product naming
- example domain for docs and stories

`src/lib/brand.ts` adapts that config for:

- Next.js `metadata`
- Next.js `viewport`
- web app manifest
- brand-aware UI components and MCP copy

## Brand Components

- [`src/components/brand/brand-logo.tsx`](../src/components/brand/brand-logo.tsx)

UI code should import `BrandLogo` / `BrandMark` instead of hardcoding product names or icon shapes.

## Asset Generation

- Generator: [`scripts/generate_brand_assets.mjs`](../scripts/generate_brand_assets.mjs)

This script derives the shipped app/browser assets from the canonical source artwork at:

- [`public/apple-touch-icon.png`](../public/apple-touch-icon.png)

It regenerates:

- `src/app/favicon.ico`
- `public/favicon.svg`
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`
- `public/icon-180.png`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/echo-mark.svg`
- `public/safari-pinned-tab.svg`

The runtime metadata points Apple touch / installed-app icon usage at the generated square assets, not at the wide source artwork file.

## Rebrand Workflow

1. Update `brand.config.json`.
2. Replace the source artwork in `public/apple-touch-icon.png` if the product icon changes.
3. Update `src/components/brand/brand-logo.tsx` if the in-app mark must match the new icon shape.
4. Run `npm run generate:brand-assets`.
5. Verify:
   - `npx tsc --noEmit`
   - targeted `eslint`
   - `npm run build`
   - `npm run build-storybook`
6. Check `/login` and the browser-installed app metadata.
