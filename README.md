# MILK ROUTE · Pravartana Operations Simulation

Live multiplayer browser simulation for the Pravartana Operations Club.

## Multiplayer architecture

- Vercel serves the static game.
- Supabase Postgres stores the live room, teams, decisions, scores and game state.
- Supabase Realtime broadcasts room and team changes to every connected browser.
- One organiser creates/connects to a room and controls the global round.
- Multiple teams join the same game code and submit independently.
- The organiser advances the round for everyone together.
- The live leaderboard updates as teams submit.

## One-time setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Paste and run `supabase-schema.sql`.
4. Open `app.js`.
5. Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_PUBLISHABLE_KEY` with the values from Supabase's Connect/API Keys area.
6. Commit and push the change to GitHub.
7. Vercel will redeploy the updated site.

Supabase documents browser initialization with the project URL and publishable key, and recommends RLS on exposed tables.

## Running a competition

### Organiser

1. Open the deployed site.
2. Click **ORGANISER**.
3. Enter a room code, for example `PRAV-OPS-01`.
4. Click **CREATE LIVE ROOM**.
5. Keep the organiser panel open.
6. Share the room code with all teams.
7. Teams join from their own devices.
8. Use **TRIGGER DISRUPTION** if you want to replace the current event.
9. Use **ADVANCE ROUND** only after the round is complete.
10. On Round 5, advance once more to finish the room and reveal results.

### Teams

1. Open the same deployed URL on each team's device.
2. Click **ENTER THE SIMULATION**.
3. Enter the organiser's game code.
4. Enter a unique team name.
5. Submit the team's decision.
6. The team waits in the live room until the organiser advances the round.

## Important prototype security note

The current competition build uses anonymous Supabase access so students can join without creating accounts. The RLS policies therefore allow the browser to read/write the competition tables. This is suitable for a controlled student-event prototype, but it is not production-grade authorization.

Before a high-stakes public competition, move organiser actions behind authenticated users or Supabase Edge Functions and restrict team writes to the owning team/session.

## Fallback

If Supabase is not configured, the game automatically falls back to the original single-browser demo mode.