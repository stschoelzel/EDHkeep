# EDHKeep - Commander Collection Vault

> **⚠️ ALPHA PROTOTYPE**
> This project is currently in an early alpha stage. Features are subject to change, and bugs may occur. Use with your own test data.

EDHKeep analyzes your Magic: The Gathering Commander collection against EDHRec data to categorize cards as **Keep** (Staples), **Pending** (Potentials), or **Fail** (Bulk) using the Elbow Method algorithm.

## Features

- **Smart Analysis**: Dynamic categorization based on Elbow Method thresholds computed from EDHRec inclusion data per color.
- **Interactive Dashboard**:
    - **Stats Chart**: Donut chart showing your collection breakdown.
    - **Pending Swiper**: Drag-to-swipe interface to review borderline cards (Left = Keep, Right = Fail, Up = Skip).
    - **Detailed Lists**: Sortable, collapsible card lists with EDHRec rank, inclusion rate, and direct links to EDHRec and Scryfall.
    - **Export**: Download filtered lists as CSV compatible with **Moxfield**, **DragonShield**, or **ManaBox**.
- **Multi-Format Import**: Supports Moxfield, DragonShield, ManaBox, and DeckBox CSV formats.
- **Real-Time Progress**: SSE streaming shows analysis progress as EDHRec data is fetched.

## Tech Stack

- **Next.js 14+** (App Router) with TypeScript
- **Tailwind CSS** — Brutalist Neon Archivist design system
- **Framer Motion** — Swipe gesture physics
- **Recharts** — Stats visualization
- **Zustand** — State management
- **Custom Fonts** — Resistance (display), Karrik (body), Illinois Mono (data)

> See [DOCUMENTATION.md](./DOCUMENTATION.md) for a deep dive into the architecture and categorization logic.

## Prerequisites

- [Node.js 18+](https://nodejs.org/)

## Setup & Running

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

App runs at: `http://localhost:3000`

## How It Works

1. Upload a collection CSV (Moxfield, DragonShield, ManaBox, or DeckBox format)
2. EDHKeep fetches top cards per color from EDHRec and computes the elbow cutoff
3. Cards above the elbow = **Keep**, within buffer zone = **Pending**, below = **Fail**
4. Scryfall enriches Keep/Pending cards with images and prices
5. Review Pending cards with the swipe interface, then export your results

## Font Credits

- **Resistance** by A collective. Distributed by [Velvetyne Type Foundry](https://velvetyne.fr/fonts/resistance/). SIL OFL 1.1.
- **Karrik** by Jean-Baptiste Morizot, Lucas Le Bihan. Distributed by [Velvetyne Type Foundry](https://velvetyne.fr/fonts/karrik/). SIL OFL 1.1.
- **Illinois Mono** by [MadSimple](https://github.com/MadSimple/illinois-mono). SIL OFL 1.1.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE.md](./LICENSE.md) file for details.
