# MediTrack Frontend

React + Vite + Tailwind CSS.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start dev server (proxies /api to backend on port 5000):
   ```
   npm run dev
   ```

   App runs at: http://localhost:3000

## Notes
- Ensure backend is running on port 5000 before starting frontend.
- All `/api/*` requests are proxied to `http://localhost:5000` via Vite config.
