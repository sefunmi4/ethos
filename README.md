# ethos
A platform for reviewing problems and going on quest to solve them.

## 📖 About

Ethos is a community-first platform where users can post real-life problems, connect through empathy, and build solutions through collaboration.
It aims to bridge the gap between personal challenges and actionable quests, eventually evolving into a quest-based gig network and community adventure guild ecosystem.

In a world where work, life, and connection feel fragmented, Ethos brings people together to share experience, offer help, or embark on adventures to solve real-world problems.

---

## 🎯 Key Features

- Problem Posting: Share daily struggles, big or small (like Yelp, but for life).
- Community Interaction: Comment, react, and empathize with others’ problems.
- Solution Building: Prototype, test, and deliver crowd-sourced solutions.
- Quest System (Future): Turn accepted problems into live quests to be solved individually or in groups.
- Guild Formation (Future): Form or join guilds of likeminded adventurers to tackle quests together.
- Web3 Integration (Future): Decentralized contracts and reputation systems for quests and achievements.

---

## 📦 Folder Structure

### Frontend (ethos-frontend/)

```bash
ethos-frontend/
├── public/
├── src/
│   ├── api/            # Axios API calls
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route pages
│   ├── contexts/       # Authentication context
│   ├── utils/          # Utility functions
│   ├── App.jsx         # App routing
│   ├── main.jsx        # Entry point
│   └── styles/         # CSS / Tailwind styles
├── package.json
└── vite.config.js
```

### Backend (ethos-backend/)

```bash
ethos-backend/
├── src/
│   ├── controllers/    # Logic for requests
│   ├── models/         # Database models
│   ├── routes/         # API endpoints
│   ├── middlewares/    # Auth and error handlers
│   ├── utils/          # JWT, password hashing
│   ├── app.js          # Express setup
│   ├── config.js       # Config variables
│   └── server.js       # Start server
├── prisma/             # (if using PostgreSQL)
├── package.json
└── .env
```


---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ethos.git
cd ethos
```


---

### 2. Setup Frontend
```bash
cd ethos-frontend
npm install
npm run dev
```

- Environment Variables: (optional for API URL)

Create .env in ethos-frontend/:

```jsx
VITE_API_URL="http://localhost:5000/api"
```

---

### 3. Setup Backend
```bash
cd ethos-backend
npm install
npm run dev
```

- Environment Variables:

Create .env in ethos-backend/:

```jsx
PORT=5000
JWT_SECRET=your_secret_key
MONGODB_URI=your_mongodb_uri    # if using MongoDB
DATABASE_URL=your_postgresql_uri # if using PostgreSQL
```


---

## 🧠 Core Flow (MVP)
 1.	User Register/Login → Auth Context stores session.
 2.	User Posts a Problem → Backend stores it.
 3.	Problems Feed → Frontend fetches and displays.
 4.	Comments & Reactions → Users engage with problems.
 5.	Quest/Branch System (Future) → Evolve problems into quests with prototype and test phases.

---

## 🌱 Roadmap

| Phase	| Focus |
| -------- | ------- |
| MVP	| Problems, Comments, Reactions
| Phase 1 |	Problem Tree Mapping + Branching
| Phase 2 |	Quest System + Guilds
| Phase 3 |	Location-based Adventures (like Pokémon GO)
| Phase 4 |	Web3 Integration for Quests
| Phase 5 |	Real-world Guild Hubs & Communities



---

## ✨ Vision

“Every person has unique experiences that matter — Ethos lets you contribute your wisdom to solve problems, not by fitting in, but by showing up as yourself.”

Together, we’re building a more connected, empathetic, and adventurous world. 🌎⚡


---

## 📜 License

This project is licensed under the MIT License.
