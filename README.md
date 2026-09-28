# 🎾 Tennis Tournament

A small web app for running a tennis tournament: players, coaches, a match schedule, and live point-by-point scoring.

- **Backend:** Node.js + Express (`/server`)
- **Database:** Prisma ORM
- **Frontend:** plain HTML, CSS and JavaScript (`/client`), served by Express

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
cd server
cp .env.example .env     # database settings
npm install
npm run build            # set up Prisma and create the database tables
npm run dev              # start the server (restarts when you save a file)
```

Then open http://localhost:3000

## Useful commands (run inside `/server`)

| Command | What it does |
|---|---|
| `npm run dev` | start the server and restart it on every file change |
| `npm start` | start the server (no auto-restart) |
| `npm test` | run the tennis scoring tests |
| `npx prisma studio` | open a visual editor for the database at http://localhost:5555 |
| `npx prisma migrate dev --name <change>` | after editing `schema.prisma`, update the database |

## Pages

| Page | URL |
|---|---|
| Schedule (live, upcoming, results) | `/` |
| Players | `/players.html` |
| Coaches (and linking players) | `/coaches.html` |
| Matches | `/matches.html` |
| Live score for a match | `/score.html?id=<match id>` |

## API

| Method | URL | What it does |
|---|---|---|
| GET | `/api/health` | check the server and database are working |
| GET, POST | `/api/players` | list / create players |
| GET, PUT, DELETE | `/api/players/:id` | get / update / delete a player |
| GET, POST | `/api/coaches` | list / create coaches |
| GET, PUT, DELETE | `/api/coaches/:id` | get / update / delete a coach |
| POST, DELETE | `/api/coaches/:id/players/:playerId` | link / unlink a player and coach |
| GET, POST | `/api/matches` | list / create matches |
| GET, PUT, DELETE | `/api/matches/:id` | get / update / delete a match |
| POST | `/api/matches/:id/point` | record a point, body `{ "player": 1 }` or `{ "player": 2 }` |
| POST | `/api/matches/:id/undo` | take back the last point |
| GET | `/api/schedule` | matches grouped into `live`, `upcoming` and `past` |

## How scoring works

Every point is stored in order as a string like `"1121221"` (who won each point).
The score (games, sets, deuce, tiebreaks, winner) is always calculated from that string
by [`server/scoring.js`](server/scoring.js), so **undo** simply removes the last character.
The rules are covered by tests in [`server/scoring.test.js`](server/scoring.test.js).
