# EDHKeep - MTG Collection Analyzer

> **⚠️ ALPHA PROTOTYPE**
> This project is currently in an early alpha stage. Features are subject to change, and bugs may occur. Use with your own test data.

EDHKeep allows you to upload your Magic: The Gathering collection (CSV) and analyze it against EDHRec data to identify "Staples" (Keep), "Potentials" (Pending), and "Bulk" (Fail).

## Features

- **Smart Analysis**: categorization based on dynamic "Elbow Method" thresholds from EDHRec data.
- **Interactive Dashboard**:
    - **Visual Specs**: Pie charts showing your collection's potential.
    - **Pending Swiper**: Tinder-style interface to review "Pending" cards (Swipe Left to Keep, Right to Fail).
    - **Detailed Lists**: Sortable, collapsible lists with direct links to EDHRec and Scryfall.
    - **Dataset Export**: Download your filtered "Keep" or "Fail" lists in CSV formats compatible with **Moxfield**, **DragonShield**, or **ManaBox**.
- **Privacy Focused**: All analysis happens locally or via direct API calls; no data is stored on external servers.

## Project Structure

- **backend/**: FastAPI (Python) server handling data fetching, image resolution, and categorization.
- **frontend/**: React + Vite web interface with a premium dark-mode design.

> 📚 **Detailed Documentation**: See [DOCUMENTATION.md](./DOCUMENTATION.md) for a deep dive into the Tech Stack and Categorization Logic.

## Prerequisites

- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)

## Setup & Running

### 1. Backend

Open a terminal in the `backend` folder:

```bash
cd backend
# Install dependencies
pip install -r requirements.txt

# Run server
python -m uvicorn app.main:app --reload
```
*Server runs at: `http://127.0.0.1:8000`*

### 2. Frontend

Open a new terminal in the `frontend` folder:

```bash
cd frontend
# Install dependencies
npm install

# Run dev server
npm run dev
```
*App runs at: `http://localhost:5173`*
## License

This project is licensed under the Apache 2.0 License - see the [LICENSE.md](./LICENSE.md) file for details.
