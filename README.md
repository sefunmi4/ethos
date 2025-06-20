# ethos

A platform for turning real-world problems into collaborative quests and freelance adventures.

## 📖 About

Ethos is a decentralized platform designed for modern adventurers, creators, and freelancers to transform problems into collaborative quests. Whether you're facing personal challenges, freelance gigs, or global issues—Ethos enables you to log, track, and solve them through community-driven effort and layered teamwork.

The platform evolves traditional problem-posting into a full ecosystem of:

* Quest tracking
* Team collaboration
* Visual boards
* Adventure guild formation
* Web3-based recognition systems (future)

It’s a new operating system for solving problems together.

---

## 🎯 Key Features

* **Post Problems** – Share life struggles, project needs, or global ideas.
* **Turn Posts Into Quests** – Structure solutions into sub-tasks or threads.
* **Boards & Threads** – Navigate via visual boards, timelines, or threaded views.
* **Adventure Guilds** – Collaborate through guilds with defined roles and ranks.
* **Quest Logs** – Track the history, updates, and team discussions around any quest.
* **AI Content Reviews** – Rate and tag AI apps, quests, creators, or datasets.
* **Quick Sharing** – Use the action menu to copy post quotes or grab a direct link.
* **Visual Quest Maps** – Tree, grid, or list views of how solutions evolve.
* **Freelancer-Oriented** – Designed to support real client work, solo projects, and peer-based micro-teams.
* **Web3-Ready (Future)** – Enable decentralized contracts and token-based achievements.

---

## 📦 Folder Structure

### Frontend (`ethos-frontend/`)

```bash
ethos-frontend/
├── public/
├── src/
│   ├── api/            # Axios API calls
│   ├── components/
│   │   ├── boards/       # Board and layout layers
│   │   ├── quests/      # Quest maps and summaries
│   │   ├── posts/       # Atomic post editors and cards
│   │   └── shared/      # Profile, layout, common UI
│   ├── pages/          # Route views (home, profile, quest, board)
│   ├── contexts/       # AuthContext, BoardContext
│   ├── utils/          # Formatting, filters
│   ├── App.jsx
│   └── main.jsx
├── .env
└── package.json
```

### Backend (`ethos-backend/`)

```bash
ethos-backend/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/         # posts, quests, users, boards
│   ├── middlewares/
│   ├── logic/          # postFormatter, questFormatter
│   ├── data/           # Mock or seed data
│   ├── app.js
│   └── server.js
├── .env
├── package.json
└── prisma/             # PostgreSQL if used
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ethos.git
cd ethos
```

### 2. Setup Frontend

```bash
cd ethos-frontend
npm install
npm run dev
```

Vite looks for `postcss.config.cjs` in this directory. If you encounter
"Failed to load PostCSS config" errors, ensure there is no leftover
`postcss.config.js` file. Make sure to rerun `npm install` so the
`@tailwindcss/postcss` plugin is available after pulling new changes.
If the plugin cannot be found after installing, try running `npm install --legacy-peer-deps` to resolve peer dependency conflicts.

`.env` for frontend:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

### Theme Tokens

UI colors are centralized in `ethos-frontend/src/theme.ts` and mirrored in the
Tailwind config. Use these variables instead of hard-coded color strings when
styling components.

| Token | Hex |
| ----- | ---- |
| `primary` | `#111827` |
| `accent` | `#4F46E5` |
| `soft` | `#F3F4F6` |
| `primaryDark` | `#f9fafb` |
| `softDark` | `#1f2937` |
| `infoBackground` | `#bfdbfe` |

### 3. Setup Backend

```bash
cd ethos-backend
npm install
npx ts-node src/server.ts       # or: npm run dev
```

For production builds, run `npm run build` and then start with `node dist/server.js`.

### Running Tests

Execute the backend test suite after installing dependencies:

```bash
npm test --prefix ethos-backend
```

This runs the Jest tests under `ethos-backend/tests`.

To run the frontend test suite:

```bash
npm test --prefix ethos-frontend
```

This runs the frontend Jest tests in `ethos-frontend/tests`.

`.env` for backend:

```env
PORT=3001
ACCESS_SECRET=your_access_secret
REFRESH_SECRET=your_refresh_secret
DATABASE_URL=your_postgresql_uri
```

The backend logger supports a `LOG_LEVEL` environment variable. Set it to
`error`, `warn`, `info` (default), or `debug` to control the verbosity of
console output. Each log line includes a timestamp for easier tracing.

## API Routes

- `POST /api/quests/:id/complete` – mark a quest as completed. Linked posts with
  `cascadeSolution` are tagged as `solved` and links with `notifyOnChange`
  trigger a placeholder notification.

---

## 🧠 Core Flow

1. Users log in and gain access to their profile and quests.
2. Users post a request, idea, or problem → becomes a board item.
3. Posts evolve into quests or threads based on collaboration.
4. Quests are mapped visually and tracked via quest logs.
5. Boards show all active or completed items in grid, list, or timeline views.

## Task Status & Kanban Boards

Boards include a Kanban layout for tracking tasks as they move through
different stages. Each card can be in one of four statuses:

- **To Do** – waiting to be picked up
- **In Progress** – actively being worked on
- **Blocked** – something is preventing progress
- **Done** – completed and ready for review

Click and hold a card to drag it to another column. Dropping the card updates
its status immediately and the overall quest progress reflects the change for
everyone on the board.

### Setup for drag and drop

The Kanban board relies on the `@dnd-kit` libraries. Install `@dnd-kit/core`
in the frontend directory before running the app. The `@dnd-kit/sortable`
package is optional if you want additional sorting utilities:

```bash
npm install --prefix ethos-frontend @dnd-kit/core
```

### Graph View Linking

Drag nodes on top of other nodes in the graph view to create parent/child links. Nodes with a type or tag of `quest` appear as folder icons (📁) so you can visually organize quests. This drag-and-drop behavior uses the same `@dnd-kit/core` dependency as the Kanban board.

When a node has more than five children, the graph condenses those children into small circle icons. Clicking a condensed node sets it as the focus and expands its subtree while siblings stay collapsed.


---

## 🌱 Roadmap

| Phase | Focus                                        |
| ----- | -------------------------------------------- |
| MVP   | Core post + board + quest log system         |
| P1    | Structured quests (map/tree/grid)            |
| P2    | Guild formation and XP/rank system           |
| P3    | Marketplace + public client work             |
| P4    | Web3 smart contracts for quests              |
| P5    | In-person guild hubs, badges, and IRL events |

---

## ✨ Vision

> “Every challenge is a quest. Every person can be an adventurer.”

Ethos is not just a social platform—it’s a new approach to collaboration where every post can become a quest, and every user can build their legend.

Join to explore, contribute, or lead your own adventures. ⚔️🛠️🌍

---
### Beta Stage (v0.1)

Current build includes:
- User sign up and login via API
- Posting messages, logs and tasks
- Quests linking posts with Git repo metadata
- Boards to visualize posts and quests in grid, graph or thread views
- Thread replies endpoint now supports pagination via `page` and `limit` query options
- Inline linking of quests and posts
- Link dropdowns support node ID search and sorting
- Review system for AI apps, quests and creators

Planned enhancements before stable release:
- In-app file change views for Git commits
- Iterative quest scoring and progress calculations
- CI/CD integration for commit posts


## 📜 License

MIT License © 2025 Ethos Project
