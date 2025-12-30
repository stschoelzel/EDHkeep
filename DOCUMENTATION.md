# EDHKeep Technical Documentation

## 1. Tech Stack

### Backend: Python (FastAPI)
*   **Why**: Python is the language of choice for data analysis and scripting. FastAPI provides a high-performance, easy-to-use framework for building APIs with automatic Swagger documentation. It allows for seamless integration with data science libraries like `numpy`.
*   **Key Libraries**:
    *   `fastapi`: Web framework.
    *   `uvicorn`: ASGI server.
    *   `numpy`: Used for efficient calculation of the "Elbow Method" algorithm.
    *   `requests`: For fetching data from external APIs (Scryfall, EDHRec).
    *   `pyedhrec` (custom): A wrapper to interact with EDHRec's data endpoints.

### Frontend: React (Vite)
*   **Why**: React offers a component-based architecture perfect for interactive UIs like dashbords and card swipers. Vite is chosen for its lightning-fast build times and modern development experience.
*   **Key Libraries**:
    *   `recharts`: For visualizing data (Pie Charts).
    *   `framer-motion`: For fluid animations (Swiper interface).
    *   `lucide-react`: For consistent, clean iconography.

---

## 2. Core Concepts & Logic

### The "Staple" Problem
Commander (EDH) players often accumulate large collections. Determining which cards are "Staples" (universally useful) vs. "Bulk" (rarely played) is subjective and changes over time. EDHKeep aims to solve this using **Data-Driven Categorization**.

### The Logic

1.  **Data Source**: We query **EDHRec**, the leading database for Commander decklists. We specifically look at the "Top Cards" for each color (White, Blue, Black, Red, Green).
2.  **Dynamic Thresholds (The Elbow Method)**:
    *   Instead of an arbitrary "Top 100", we calculate the "Drop-off point" in popularity.
    *   Popularity follows a power law distribution (a few cards are in *many* decks, then it drops off sharply).
    *   We use the **Elbow Method** (calculating the maximum perpendicular distance from the line connecting the first and last data point) to find where the "Staples" end and the "Niche/Playable" cards begin.
    *   **Keep**: Cards ranked *above* this elbow point.
    *   **Pending**: Cards in the "buffer zone" (rank `elbow` to `elbow + 50`). These are borderline staples often worth reviewing manually.
    *   **Fail**: Cards ranked below the buffer zone or not present in the top lists.

### Workflow

1.  **Upload**: User uploads a CSV (Moxfield format).
2.  **Parse**: The backend normalizes card names (handling split cards like "Fire // Ice").
3.  **Fetch & Analyze**:
    *   The backend fetches the current "Top Cards" from EDHRec for all 5 colors.
    *   It calculates the live Cutoff point for each color.
4.  **Match**:
    *   User's cards are compared against these dynamic lists.
    *   Metadata (Rank, Image URL, Price) is attached.
5.  **Review**:
    *   **Keep** list is auto-approved.
    *   **Pending** cards are presented in a "Tinder-style" swiper for the user to make the final call based on their personal preference or art.
    *   **Fail** list suggests bulk storage.
6.  **Export**:
    *   Filtered lists can be exported as CSVs.
    *   Supported Formats: **Moxfield** (default), **DragonShield**, **ManaBox**.
    *   This allows users to physically sort their cards, then import the digital list into their preferred management tool.
