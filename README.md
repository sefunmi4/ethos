# ethos

A platform for turning real-world problems into collaborative quests and freelance adventures.

## 📖 About

Ethos is a decentralized platform designed for modern adventurers, creators, and freelancers to transform problems into collaborative quests. Whether you're facing personal challenges, freelance gigs, or global issues—Ethos enables you to log, track, and solve them through community-driven effort and structured teamwork.

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
│   │   ├── boards/       # Board and structure layers
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

`.env` for frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Setup Backend

```bash
cd ethos-backend
npm install
npm run dev
```

`.env` for backend:

```env
PORT=5000
JWT_SECRET=your_secret_key
DATABASE_URL=your_postgresql_uri
```

---

## 🧠 Core Flow

1. Users log in and gain access to their profile and quests.
2. Users post a request, idea, or problem → becomes a board item.
3. Posts evolve into quests or threads based on collaboration.
4. Quests are mapped visually and tracked via quest logs.
5. Boards show all active or completed items in grid, list, or timeline views.

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

## 📜 License

MIT License © 2025 Ethos Project
