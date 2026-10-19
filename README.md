# benediktschnupp.com

Portfolio of Benedikt Schnupp, product designer for UX/UI, brand and motion. The site is a Next.js app (pages router) with markdown-based case studies, scroll-driven animations and a local editor for content.

## Tech stack

- **Next.js 14** (pages router, static generation) on **React 18** and **TypeScript**
- **Tailwind CSS 3** with `@tailwindcss/typography`
- **Framer Motion**, **GSAP** and **Lenis** for animation and scrolling
- **three.js** via `@react-three/fiber` / `drei`, and **Lottie** via `lottie-react`, both loaded on demand
- **Resend** for the contact form and newsletter
- **Vercel** hosting, Vercel Blob for larger media, Vercel Analytics and Speed Insights
- **Storybook 10** with the a11y addon, **Vitest** for component tests

## Getting started

Requirements: Node.js 20 or newer and npm.

```bash
npm install
cp .env.local.example .env.local   # only needed for the contact form and newsletter
npm run dev                        # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run backend` | Development server with the content editor under `/admin` (`NEXT_PUBLIC_ADMIN=true`, dev only) |
| `npm run storybook` | Storybook on port 6006 |
| `npm run test-storybook` | Runs the Storybook stories as Vitest browser tests |
| `npm run make:spritesheet` | Builds a WebP spritesheet from numbered frames (see `scripts/make-spritesheet.mjs`) |

## Environment variables

See `.env.local.example`. All of them are optional for local development.

| Variable | Used for |
| --- | --- |
| `RESEND_API_KEY` | Sending contact form mails and newsletter signups |
| `RESEND_FROM` | Sender address of contact form mails |
| `CONTACT_EMAIL` | Inbox that receives contact form messages |
| `RESEND_NEWSLETTER_SEGMENT_ID` | Optional Resend segment for newsletter signups |

## Project structure

```
content/
  projects/        # One markdown file per project / case study (front matter + blocks)
  work-hubs/       # Copy for the /work/design, /work/ux-ui and /work/development hubs
public/
  assets/          # Images, videos, Lottie files and 3D models referenced from content
  fonts/           # Space Grotesk and Inter as subsetted WOFF2
src/
  pages/           # Routes: home, /about, /contact, /work, /work/[hub], /project/[slug], 404, admin, API
  components/      # Page sections (Hero, Work, Skills, Footer …) and case study blocks (Article, Mockup …)
  lib/             # Content loading (markdown, work hubs), SEO, fonts, image helpers
  utils/           # Asset preloading and scroll-scrub video helpers
  stories/         # Storybook stories and fixtures
docs/              # Notes on content blocks, e.g. color palettes
```

## Content

Projects live in `content/projects/*.md`. The front matter holds title, category, colors, hero media and optional scroll animations (`animationSequence` with a video or spritesheet). The body is markdown with extra fenced blocks such as `mockup`, `gallery`, `palette`, `insight`, `font` and `stat`, rendered by `src/components/Article.tsx`. Run `npm run backend` and open `/admin` to edit projects and hubs in the browser; the editor only works in development and writes straight to the files in this repo.

Media paths are relative to `public/` (for example `assets/reminders-plus/reminders-promo.jpg`) or full URLs on Vercel Blob.

## Images and fonts

- Next.js image optimization is on. `next/image` is used where possible; plain `<img>` tags and CSS backgrounds go through `src/lib/image.ts`, which builds the same `/_next/image` URLs (AVIF/WebP, resized). Spritesheets and animation frames stay untouched because the scroll animations depend on their exact pixel size.
- Remote images are only optimized for the hosts in `images.remotePatterns` in `next.config.js`. Add new hosts there and in `src/lib/image.ts`.
- Fonts are loaded with `next/font/local` from `public/fonts` (`src/lib/fonts.ts`). They are WOFF2 files subsetted to Latin, Latin Extended and common symbols. To add a weight, convert the TTF with `pyftsubset` from `fonttools` using the same unicode ranges.

## Deployment

The `main` branch deploys to Vercel. Pages are statically generated at build time, so content changes need a new deployment.
