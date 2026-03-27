# 🚀 Earnegg Performance Enhancement Roadmap

To ensure the Earnegg mini-app runs smoothly on all devices (especially iOS) and fetches data from Supabase instantly, follow these optimization strategies.

## 1. Supabase & Backend Optimization (Faster Data)

### 🛰️ Consolidate Initial RPC Calls
Currently, the app makes multiple separate RPC calls on load (`register_player`, `sync_bot_earnings`, `claim_daily_reward`).
- **Enhancement:** Combine these into a single `get_startup_data(p_telegram_id)` RPC.
- **Result:** Reduces network latency from 3 round trips to 1, cutting load time by ~60%.

### ⚡ Database Indexing
Ensure your Supabase tables have proper indexes on columns used in `WHERE` clauses:
- `players(id)` (Primary key is indexed, but double-check foreign keys).
- `wheel_spins(player_id, created_at)`.
- `egg_tower_games(player_id)`.
- **SQL Hint:** `CREATE INDEX idx_wheel_spins_player_date ON wheel_spins(player_id, created_at);`

### 🔍 Selective Column Fetching
Avoid `.select('*')` if you only need the balance.
- **Enhancement:** Use `.select('balance, energy, multitap_level')`.
- **Result:** Smaller payload size and faster JSON parsing.

---

## 2. Frontend Optimization (Smoother UI)

### 📦 Code Splitting (Lazy Loading)
The initial bundle includes all games and pages.
- **Enhancement:** Use `React.lazy()` for game routes in `App.tsx`.
- **Example:** `const EggTower = lazy(() => import('./pages/EggTower'));`
- **Result:** Users only download the game code when they actually click to play.

### 🧠 Memoization & Context Split
Since `AppContext` holds everything (balance, energy, levels), any change to energy (which happens every 2s) re-renders the whole app.
- **Enhancement:**
  - Wrap components in `React.memo()`.
  - Use `useMemo` for the context provider's `value`.
  - Or, move "High-Frequency" state (like Energy/Balance) into a dedicated context or a lighter state manager like `Zustand`.

### 🖼️ Asset Optimization
- **Images:** Convert PNG/JPG icons to **WebP** format.
- **Icons:** Continue using `Lucide-React`, but ensure they are tree-shaken (only include used icons).
- **Animations:** Use `translate3d` (already implemented in games) to trigger GPU acceleration on iOS.

---

## 3. Network & Caching

### 🔄 Use TanStack Query (React Query)
Manual `useEffect` fetching lacks caching.
- **Enhancement:** Integrate `@tanstack/react-query`.
- **Benefit:** It handles background fetching, caching results (so "Back to Hub" is instant), and automatic retries.

### 📡 Optimistic UI
- **Enhancement:** When a user buys a booster or finishes a game, update the local `balance` *immediately* before the server confirms. If the server fails, roll it back.
- **Result:** The app feels "instant" instead of waiting for a Spinner.

---

## 🧪 Recommended Action Plan

1.  **Immediate:** consolidate the startup RPC to fix the initial "Loading" delay.
2.  **Next:** Implement `React.lazy` for `EggCatcher` and `EggTower` pages.
3.  **Long-term:** Migration to a more granular state management (Zustand) to stop unnecessary full-app re-renders.
