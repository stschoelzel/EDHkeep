# CLAUDE.md - EDHKeep

## Project Overview

EDHKeep is a full-stack MTG (Magic: The Gathering) collection analyzer. Users upload their collection as CSV, and the app categorizes cards into Keep/Pending/Fail tiers using EDHRec popularity data and the Elbow Method algorithm. Alpha stage.

## Tech Stack

- **Backend**: Python 3.9+ / FastAPI / Uvicorn / Pydantic / NumPy
- **Frontend**: React 19 / Vite 7 / Framer Motion / Recharts / Lucide React
- **External API**: EDHRec (via pyedhrec package from GitHub)

## Project Structure

```
backend/app/          # FastAPI application
  main.py             # App entry point, routes, CORS config
  models.py           # Pydantic MTGCard model
  analysis.py         # Elbow Method cutoff algorithm
  services.py         # EDHRecService (API integration)
  csv_service.py      # CSV parsing/generation (Moxfield, DragonShield, ManaBox, DeckBox)
  categorization_service.py  # Card categorization logic

frontend/src/         # React application
  App.jsx             # Root component, global state
  components/
    Dashboard.jsx     # Main dashboard layout
    UploadArea.jsx    # File upload interface
    StatsChart.jsx    # Pie chart statistics
    CardList.jsx      # Collapsible card lists
    PendingSwiper.jsx # Tinder-style card reviewer
    ExportPanel.jsx   # CSV export functionality

testfiles/            # Sample CSV test data
```

## Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload    # Dev server at http://127.0.0.1:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # Dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Tests (backend, no formal framework)
```bash
cd backend
python smoke_test.py
python test_analysis.py
python test_enhanced_metadata.py
```

## Architecture & Conventions

- **Service layer pattern**: Backend separates concerns into discrete services (EDHRecService, CSVService, CategorizationService) instantiated once in main.py
- **State management**: Frontend uses local `useState` hooks (no Redux/Context)
- **Styling**: CSS variables for theming, dark-mode glassmorphism design, inline styles for dynamic values
- **API communication**: Frontend fetches from `http://localhost:8000` (hardcoded)
- **CORS**: Backend allows all origins (`allow_origins=["*"]`)
- **Commit style**: Conventional commits (`feat:`, `fix:`, etc.)
- **Main branch**: `master`

## Key Algorithms

- **Elbow Method** (`analysis.py`): Finds the drop-off point in EDHRec popularity distribution using perpendicular distance calculation. Determines the Keep/Pending threshold dynamically.
- **Categorization** (`categorization_service.py`): Fetches top cards per MTG color, applies Elbow Method per color, then aggregates. Cards above elbow = Keep, within 50 of elbow = Pending, rest = Fail.

## Known Limitations

- No formal test framework (pytest not installed)
- No CI/CD pipeline
- No environment variable management (.env files)
- Frontend API base URL is hardcoded to localhost
- CORS is fully open (dev-only setting)
