# Media Shelf

A personal, self-hosted app for the books, movies and TV shows I want to get to. SvelteKit + TypeScript + Postgres, deployed to Railway.

## Local setup

Needs Node 22+ and Docker.

```sh
cp .env.example .env          # then fill in APP_PASSWORD, SESSION_SECRET, TMDB_TOKEN
docker compose up -d          # Postgres on localhost:5433
npm install
npm run db:migrate            # create the tables
npm run dev                   # http://localhost:5173
```

## Scripts

- `npm run dev`: dev server
- `npm run db:generate -- --name <change>`: write a migration after editing `src/lib/server/db/schema.ts`
- `npm run db:migrate`: apply pending migrations from `drizzle/`
- `npm run db:studio`: browse the database in Drizzle Studio
- `npm run icons`: re-render the app icons in `static/icons` from `scripts/generate-icons.mjs`
- `npm run check`: type check (svelte-check)
- `npm run build` / `npm run preview`: production build

## Installing and offline

The app is a PWA: `static/manifest.webmanifest` plus a service worker in `src/service-worker.ts`
(registered automatically by SvelteKit). The worker precaches the app code and icons, keeps the last
copy of every page you open (network first), and caches cover images. Offline, the list and any
item you opened before still load; pages never opened fall back to the list. Searching and saving
need a connection.

Test it on a production build, since the dev server doesn't precache:

```sh
npm run build && npm run preview   # http://localhost:4173, then install from Chrome's address bar
```

## Environment variables

Declared and validated in `src/env.ts`; server code imports them from `$app/env/private`.

| Name             | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `DATABASE_URL`   | Postgres connection string                  |
| `APP_PASSWORD`   | The one login password                      |
| `SESSION_SECRET` | Signs the session cookie                    |
| `TMDB_TOKEN`     | TMDB API read access token (server only)    |
