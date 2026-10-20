# Media Shelf

A personal, self-hosted app for the books, movies and TV shows I want to get to. SvelteKit + TypeScript + Postgres, deployed to Railway.

## Local setup

Needs Node 22+ and Docker.

```sh
cp .env.example .env          # then fill in APP_PASSWORD, SESSION_SECRET, TMDB_TOKEN
docker compose up -d          # Postgres on localhost:5433
npm install
npm run dev                   # http://localhost:5173
```

## Scripts

- `npm run dev`: dev server
- `npm run check`: type check (svelte-check)
- `npm run build` / `npm run preview`: production build

## Environment variables

| Name             | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `DATABASE_URL`   | Postgres connection string                  |
| `APP_PASSWORD`   | The one login password                      |
| `SESSION_SECRET` | Signs the session cookie                    |
| `TMDB_TOKEN`     | TMDB API read access token (server only)    |
