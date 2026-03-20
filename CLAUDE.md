# CLAUDE.md - EDHKeep

## Project Overview

EDHKeep is an MTG (Magic: The Gathering) Commander collection analyzer. Users upload their collection as CSV, and the app categorizes cards into Keep/Pending/Fail tiers using EDHRec popularity data and the Elbow Method algorithm. Alpha stage.

## Tech Stack

- **Framework**: Next.js 14+ (App Router) / TypeScript / Tailwind CSS v4
- **UI**: Framer Motion / Recharts / Lucide React
- **State**: Zustand (with shallow selectors)
- **CSV**: PapaParse (parsing), client-side generation (export)
- **External APIs**: EDHRec (JSON, direct fetch), Scryfall (batch collection endpoint)
- **Design System**: Brutalist Neon Archivist — 0px corners, neon status colors, tonal layering

## Project Structure

```
src/app/                  # Next.js App Router
  layout.tsx              # Root layout, fonts, metadata
  page.tsx                # Home: upload area
  globals.css             # Tailwind tokens, font faces, glow utilities
  dashboard/page.tsx      # Dashboard page
  api/upload/route.ts     # POST: CSV → categorize → SSE stream
  api/scryfall/route.ts   # POST: batch card enrichment proxy

src/lib/                  # Core logic (shared between server and client)
  types.ts                # All TypeScript interfaces
  constants.ts            # Color maps, thresholds, format signatures
  elbow.ts                # Elbow Method algorithm
  csv-parser.ts           # Multi-format CSV parsing
  csv-export.ts           # Client-side CSV generation (3 formats)
  edhrec-client.ts        # EDHRec JSON API fetcher + 1hr cache
  scryfall-client.ts      # Scryfall batch client (75/batch, rate limited)
  categorize.ts           # Orchestration: fetch → elbow → categorize

src/components/           # React components
  upload-area.tsx         # Drag-and-drop CSV upload
  dashboard.tsx           # Main dashboard layout
  progress-tracker.tsx    # SSE progress display
  stats-chart.tsx         # Recharts donut chart
  pending-swiper.tsx      # Card stack + action buttons
  swipe-card.tsx          # Draggable card (framer-motion)
  card-list.tsx           # Collapsible sorted table
  card-row.tsx            # Single card row
  export-panel.tsx        # Format picker + download
  ui/button.tsx           # 0px radius, neon glow
  ui/badge.tsx            # Category chip
  ui/spinner.tsx          # Loading indicator

src/hooks/                # React hooks
  use-analysis.ts         # Upload → SSE reader → store hydration
  use-swipe-resolve.ts    # Swipe direction → category mapping

src/stores/               # State management
  collection-store.ts     # Zustand store + shallow selectors

public/fonts/             # Self-hosted: Resistance, Karrik, Illinois Mono
```

## Commands

```bash
npm install               # Install dependencies
npm run dev               # Dev server at http://localhost:3000
npm run build             # Production build
npm run lint              # ESLint
```

## Architecture & Conventions

- **Unified stack**: No separate backend — Next.js API routes replace FastAPI
- **SSE streaming**: Upload endpoint streams progress events during EDHRec fetch + categorization
- **State management**: Zustand with `useShallow()` selectors to prevent re-render loops
- **Styling**: Tailwind v4 with `@theme` inline tokens, CSS custom properties for glow effects
- **Design rules**: 0px border radius everywhere, no 1px borders (tonal layering only), ghost borders at 15% opacity
- **Fonts**: Resistance (display), Karrik (body), Illinois Mono (data) — all self-hosted with OFL licenses
- **Commit style**: Conventional commits (`feat:`, `fix:`, etc.)
- **Main branch**: `master`

## Key Algorithms

- **Elbow Method** (`lib/elbow.ts`): Finds the drop-off point in EDHRec popularity using max perpendicular distance to the line from first to last point. Determines Keep/Pending threshold dynamically per color.
- **Categorization** (`lib/categorize.ts`): Fetches top cards for all 5 colors in parallel, applies Elbow Method per color, then aggregates. Above elbow = Keep, within 50 of elbow = Pending, rest = Fail. Keep priority if card appears in multiple colors.

## Known Limitations

- No test framework yet
- No CI/CD pipeline
- EDHRec in-memory cache doesn't persist across serverless cold starts
- No authentication or rate limiting on API routes
