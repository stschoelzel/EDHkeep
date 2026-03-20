# EDHKeep Technical Documentation

## 1. Tech Stack

### Next.js 14+ (App Router) with TypeScript
* **Why**: Unifies frontend and backend in a single project. App Router provides file-based routing, API routes replace the old FastAPI backend entirely, and TypeScript ensures type safety across the full stack.
* **Key Libraries**:
    * `next`: Framework with App Router, API routes, SSE streaming support.
    * `tailwindcss` (v4): Utility-first CSS with `@theme` design tokens.
    * `framer-motion`: Gesture physics for the swipe interface.
    * `recharts`: Donut chart for stats visualization.
    * `zustand`: Lightweight global state management.
    * `papaparse`: Robust CSV parsing (handles quoted fields, escapes, multi-format detection).
    * `lucide-react`: Technical icon set.

---

## 2. Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── page.tsx                # Home: upload area
│   ├── globals.css             # Tailwind directives + design tokens + font faces
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard page
│   └── api/
│       ├── upload/
│       │   └── route.ts        # POST: CSV → categorize → SSE stream
│       └── scryfall/
│           └── route.ts        # POST: batch card enrichment
├── lib/
│   ├── types.ts                # All shared TypeScript interfaces
│   ├── constants.ts            # Color maps, thresholds, format signatures
│   ├── elbow.ts                # Elbow Method algorithm (pure math)
│   ├── csv-parser.ts           # Multi-format CSV parsing (papaparse)
│   ├── csv-export.ts           # Client-side CSV generation (3 formats)
│   ├── edhrec-client.ts        # EDHRec JSON API fetcher + in-memory cache (1hr TTL)
│   ├── scryfall-client.ts      # Scryfall batch API client (75/batch, rate limited)
│   └── categorize.ts           # Orchestration: fetch → elbow → categorize
├── components/
│   ├── upload-area.tsx         # Drag-and-drop CSV upload
│   ├── dashboard.tsx           # Main dashboard layout
│   ├── progress-tracker.tsx    # SSE streaming progress display
│   ├── stats-chart.tsx         # Recharts donut chart
│   ├── pending-swiper.tsx      # Card stack container
│   ├── swipe-card.tsx          # Individual draggable card (framer-motion)
│   ├── card-list.tsx           # Collapsible sorted card table
│   ├── card-row.tsx            # Single row with rank, inclusion, links
│   ├── export-panel.tsx        # Format picker + CSV download
│   └── ui/
│       ├── button.tsx          # 0px radius, neon glow hover
│       ├── badge.tsx           # Category chip (Illinois Mono)
│       └── spinner.tsx         # Animated loading indicator
├── hooks/
│   ├── use-analysis.ts         # Upload → SSE reader → store hydration
│   └── use-swipe-resolve.ts    # Swipe direction → category mapping
├── stores/
│   └── collection-store.ts     # Zustand store + shallow selectors
└── public/
    └── fonts/                  # Self-hosted: Resistance, Karrik, Illinois Mono
```

---

## 3. Core Concepts & Logic

### The "Staple" Problem
Commander (EDH) players often accumulate large collections. Determining which cards are "Staples" (universally useful) vs. "Bulk" (rarely played) is subjective and changes over time. EDHKeep solves this using **Data-Driven Categorization**.

### The Logic

1. **Data Source**: EDHRec's "Top Cards" per color, fetched directly from `https://json.edhrec.com/pages/top/{color}.json` (no pyedhrec dependency).
2. **Dynamic Thresholds (The Elbow Method)**:
    * Popularity follows a power law distribution (a few cards are in *many* decks, then it drops off sharply).
    * The **Elbow Method** calculates the maximum perpendicular distance from each point to the line connecting the first and last data points, finding where the curve bends most.
    * **Keep**: Cards ranked *above* the elbow index.
    * **Pending**: Cards in the buffer zone (elbow to elbow + 50). Borderline staples worth manual review.
    * **Fail**: Cards below the buffer or not present in the top lists.

### Workflow

1. **Upload**: User drops a CSV file (Moxfield, DragonShield, ManaBox, or DeckBox format).
2. **Parse**: `csv-parser.ts` auto-detects format from headers, normalizes card names (split cards like "Fire // Ice" → "Fire").
3. **Fetch & Analyze**:
    * `categorize.ts` fetches top cards from EDHRec for all 5 colors **in parallel**.
    * Calculates the live elbow cutoff per color.
    * SSE streams progress events to the client in real time.
4. **Enrich**:
    * Keep and Pending cards are batch-enriched via Scryfall `/cards/collection` (images, prices).
    * Fail cards are skipped to save API calls.
5. **Review**:
    * **Keep** list is auto-approved and shown in a collapsible table.
    * **Pending** cards are presented in a drag-to-swipe interface (left = Keep, right = Fail, up = Skip).
    * **Fail** list suggests bulk storage.
6. **Export**:
    * Filtered lists can be exported as CSV, generated client-side.
    * Supported formats: **Moxfield**, **DragonShield**, **ManaBox**.

---

## 4. API Routes

### `POST /api/upload`
Main analysis endpoint. Accepts `FormData` with a CSV file. Returns a Server-Sent Events stream:

```
data: {"type":"progress","step":"parsing","detail":"Parsed 342 cards...","percent":10}
data: {"type":"progress","step":"fetching_w","detail":"Fetched White top cards...","percent":15}
...
data: {"type":"progress","step":"enriching","detail":"Fetching images from Scryfall...","percent":80}
data: {"type":"result","data":{"filename":"...","total_cards":342,"stats":{...},"all_cards":[...]}}
```

### `POST /api/scryfall`
Batch enrichment proxy. Accepts `{ cards: [{ name, set?, collector_number? }] }`, handles Scryfall's 75-per-batch limit with rate limiting.

---

## 5. Design System: Brutalist Neon Archivist

### Colors
* **Keep**: Neon-mint `#89f0cb`
* **Fail**: Neon-pink `#fd6ed0`
* **Pending**: Neon-lemon `#f6e05e`
* **Surfaces**: `#131313` (base) → `#1C1B1B` (section) → `#353335` (interaction)

### Typography
* **Resistance** (Velvetyne): Display/headlines — large, imposing, tight leading
* **Karrik** (Velvetyne): Body/UI text — quirky asymmetric editorial feel
* **Illinois Mono** (MadSimple): Data/counts — all number-heavy content

### Rules
* All elements: 0px border radius (sharp corners only)
* No traditional 1px borders for sectioning — use tonal layering
* Ghost borders at 15% opacity only for extreme data density
* Shadows: extra-diffused (40-60px blur, 8% opacity), tinted with status color
* Icons: technical only (arrows, data nodes) — no fantasy imagery

---

## 6. State Management

Zustand store (`collection-store.ts`) with shallow selectors:

* `allCards: MTGCard[]` — Full card array with categories
* `stats: { Keep, Pending, Fail }` — Live counts
* `resolveCard(name, category)` — Move card from Pending to Keep/Fail
* `skipCard(name)` — Move card to end of Pending queue
* Derived selectors: `useKeepCards()`, `usePendingCards()`, `useFailCards()` with `useShallow()` to prevent re-render loops

---

## 7. External API Integration

### EDHRec
* Endpoint: `https://json.edhrec.com/pages/top/{color}.json`
* Parses: `container.json_dict.cardlists[].cardviews[]` (fallback: `container.cardlists`)
* In-memory cache with 1-hour TTL
* Each card provides: `name`, `num_decks`, `url`

### Scryfall
* Endpoint: `POST https://api.scryfall.com/cards/collection`
* Max 75 identifiers per request, 100ms delay between batches
* Returns: `image_uris` (handles double-faced cards via `card_faces`) and `prices`
