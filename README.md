(The file `d:\Prog\Project-Aether\aether\aether\README.md` exists, but is empty)

# Aether

Production-ready single-page application scaffold built with Vite, React, TypeScript, Tailwind CSS and Radix UI — integrated with Supabase for backend services.

Live demo: https://suke2004.github.io/aether/

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Quick Start](#quick-start)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Integrations](#integrations)
- [Development Notes](#development-notes)
- [Contributing](#contributing)
- [License](#license)

## Overview

Aether is a modern frontend application that uses a component-driven architecture and best-practice libraries for building interactive, responsive user interfaces. The project includes a set of reusable UI primitives, page-level views, and integrations with Supabase for authentication, real-time events, and functions.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Bundler / Dev Server:** Vite
- **Styling:** Tailwind CSS, tailwindcss-animate
- **UI Primitives:** Radix UI, shadcn-style components
- **State / Data:** @tanstack/react-query
- **Backend / Auth:** Supabase (client: `@supabase/supabase-js`)
- **Forms & Validation:** react-hook-form, zod
- **Deployment:** GitHub Pages (helper script included)

## Features

- Component-driven UI (see `src/components`)
- Parent/child dashboards, quest management and history UI components
- Realtime notifications and optional Supabase Functions
- Analytics and visualizations using `recharts`
- Accessibility-minded primitives via Radix UI

## Quick Start

Prerequisites

- Node.js 18+ (or a current LTS)
- pnpm (recommended) or npm/yarn

Install

```bash
pnpm install
```

Environment

Create a `.env` (or use your preferred env provider) with at least the Supabase values used by the app, for example:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
```

Running locally

```bash
pnpm dev
```

Build

```bash
pnpm build
```

Preview build

```bash
pnpm preview
```

Deployment

Deployment is wired for GitHub Pages. The repository contains a postbuild script (`scripts/create-gh-pages-404.cjs`) that copies a fallback 404 to `dist/` for SPA routing; `package.json` contains `predeploy`/`deploy` tasks.

## Scripts

The main scripts in `package.json` are:

- `dev` — start Vite dev server
- `build` — production build
- `build:dev` — build in development mode
- `postbuild` — runs `scripts/create-gh-pages-404.cjs` to prepare `dist/` for GH Pages
- `lint` — run ESLint
- `preview` — preview built `dist/`
- `deploy` — deploy `dist/` to GitHub Pages (uses `gh-pages`)

## Project Structure

- `src/` — application source
  - `main.tsx` — app entry
  - `App.tsx` — top-level app shell
  - `pages/` — route-level pages (e.g. `Auth.tsx`, `Index.tsx`, `NotFound.tsx`)
  - `components/` — UI components and feature areas (dashboards, quest components, market/mint screens)
  - `hooks/` — custom React hooks (auth, toast, confetti, etc.)
  - `integrations/supabase/` — supabase helpers and client setup

Other notable files

- `vite.config.ts` — Vite configuration
- `tailwind.config.ts` — Tailwind configuration
- `scripts/create-gh-pages-404.cjs` — helper for GitHub Pages SPA fallback
- `supabase/` — Supabase project config and Functions folder

## Integrations

- Supabase: authentication, database, real-time, and serverless functions (see `supabase/functions`)
- Analytics / UI: `recharts`, `react-day-picker`, `lucide-react`

## Development Notes

- Styling relies on Tailwind and a set of prebuilt primitives in `src/components/ui` (Radix + shadcn patterns). Follow that pattern for new components.
- Use `@tanstack/react-query` for async data fetching and caching.
- Keep environment secrets out of source — use `.env` for local development and your host's secret manager for production.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests / linting and ensure UI components follow existing patterns
4. Open a pull request with a clear description of changes

## License

This project includes a `LICENSE` file in the repository root. Refer to it for licensing terms.

---
