# Bug Analysis Report: Energy Reset to Zero

## Summary
Users are reporting that their energy is often zero when they open the app or after they spend energy and let it regenerate.

## Root Cause Analysis
The investigation revealed a fundamental flaw in how energy is managed between the client (React App) and the backend (Supabase).

1.  **Client-Side Only Regeneration**: Energy regeneration is currently implemented only in the frontend (`AppContext.tsx`). It increments local energy every 2 seconds.
2.  **Stale Database Value**: The `public.players` table stores an `energy` value, but it does **not** store a timestamp of when that value was last updated.
3.  **Destructive Syncing**: When a user taps, the `sync_taps` RPC subtracts the number of taps from the **database's current energy value**. It does not account for any regeneration that may have occurred since the last sync.
4.  **Overwrite on Load**: When the app loads, `get_startup_data` returns the stale energy value from the database. Since the database hasn't "seen" any regeneration, it returns the old value (often 0 if the user used it all in the previous session), which then overwrites the client's initial 1000 energy.

### Example Scenario
- User spends all energy (0/1000).
- User closes the app and waits for 1 hour.
- Local energy (if app was open) would be 1000.
- User opens the app.
- `get_startup_data` fetches `energy` from DB. DB still says 0.
- Client `setEnergy(0)`.
- User sees 0 energy.

## Proposed Fix
To fix this, the energy regeneration logic must be moved to (or mirrored on) the server using a timestamp-based calculation.

### 1. Database Schema Changes
- Add a `last_energy_sync` column (TIMESTAMP WITH TIME ZONE) to the `public.players` table.
- Set it to `now()` for all existing players.

### 2. New SQL Helper Function: `calculate_player_energy`
Create a function that calculates the "true" current energy based on elapsed time:
```sql
-- Example SQL logic
CREATE OR REPLACE FUNCTION public.calculate_player_energy(p_telegram_id text)
RETURNS integer AS $$
DECLARE
    v_energy int;
    v_last_sync timestamptz;
    v_recharge int;
    v_limit_level int;
    v_max_energy int;
    v_elapsed float;
    v_regenerated int;
BEGIN
    SELECT energy, last_bot_sync, recharge_speed_level, energy_limit_level 
    INTO v_energy, v_last_sync, v_recharge, v_limit_level
    FROM public.players 
    WHERE id = p_telegram_id;

    v_max_energy := 1000 + (v_limit_level - 1) * 500;
    v_elapsed := EXTRACT(EPOCH FROM (now() - v_last_sync));
    v_regenerated := FLOOR(v_elapsed / 2.0) * v_recharge;
    
    RETURN LEAST(v_energy + v_regenerated, v_max_energy);
END;
$$ LANGUAGE plpgsql;
```
*(Note: Using `last_bot_sync` as a temporary placeholder if `last_energy_sync` isn't added yet, but adding a dedicated column is better).*

### 3. Update all Energy-returning RPCs
All functions must use the above logic to calculate current energy before returning or updating.

## Benefit
This ensures that even when the user is offline, their energy is logically regenerating on the server. When they come back, the server calculates how much was gained while they were away and provides the correct value.
