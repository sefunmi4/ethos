# 🧭 Ethos/GuildQuest Design System

This document outlines the architecture, component philosophy, and implementation plan for the Ethos/GuildQuest platform. It establishes a consistent development path, guiding the design of quests, boards, threads, and post systems through a unified visual and data structure.

---

## 🎯 Goal

Create a professional, modular, and extensible system that:

* Uses **boards** as the universal UI layer.
* Treats **posts** as atomic units of interaction.
* Uses **quests** to organize and structure related posts.
* Introduces **threads** for conversations and quest logs.
* Renders structures (trees, lists, grids) based on item relationships.

---

## 📐 UI Principles

* Clean and professional appearance (vanilla-friendly, responsive)
* Minimal visual clutter with structure cues (expand icons, indentation)
* Modular board layouts that adapt to content (list, grid, tree, etc.)
* Views shift from overview to deep-dive (e.g., quest map → task post)

---

## 🧱 Component Architecture

### Posts (Atomic Data Units)

* Can be standalone or linked to quests, threads, or other posts.
* Post structures:

  * Flat timeline
  * Reply thread (hashmap + linked list)
  * Activity feed
* Can be rendered as board items.

### Quests (Structured Collections of Posts)

* Rooted in a summary post.
* Contain subtasks, logs, and updates as child posts.
* Visualized as:

  * Tree (QuestTree)
  * List (QuestList)
  * Grid (QuestGrid)
  * Graph (QuestGraph — supports cycles)
* Rendered using `QuestBoardMap`.

### Boards (Universal Container)

* Accepts posts, quests, or hybrid items.
* Structure adapts based on:

  * Number of items
  * Item structure preference (tree, list, grid)
* Single-item boards adopt the internal structure of the item.
* Can be filtered and sorted.

### Threads (Conversations)

* Used for chat or discussion.
* Each thread is a structured list or tree of linked posts.
* Default to timeline for quest logs, but toggleable to threaded view.

---

## 📁 File Structure & Order of Implementation

### Contexts

1. `AuthContext.js` – user, login state, permissions
2. `BoardContext.js` – view mode, structure, filters

### Pages

1. `index.jsx` – Home feed (default board)
2. `profile.jsx` – Current user's board
3. `quest/[id].jsx` – Full quest view (log + map)
4. `boards/[id].jsx` – General board view
5. `post/[id].jsx` – Post with thread
6. `new.jsx` – Create new post/quest

### Components – Quests

1. `QuestBoardMap.jsx`
2. `mapstructure/QuestList.jsx`
3. `mapstructure/QuestTree.jsx`
4. `mapstructure/QuestGrid.jsx`
5. `mapstructure/QuestGraph.jsx`
6. `QuestCard.jsx`
7. `QuestSummaryHeader.jsx`

### Components – Board

1. `Board.jsx`
2. `itemstructure/index.js`
3. `itemstructure/BoardItemList.jsx`
4. `itemstructure/BoardItemGrid.jsx`
5. `itemstructure/BoardItemScroll.jsx`
6. `BoardToolbar.jsx`
7. `BoardAddItem.jsx`
8. `BoardItemCard/index.jsx`
9. `BoardItemCard/ItemStructureView.jsx`
10. `utils.js`

### Components – Posts

1. `PostCard/index.jsx`
2. `PostHeader.jsx`
3. `PostActions.jsx`
4. `PostFooterMenu.jsx`
5. `PostMetaBar.jsx`
6. `PostEditor/index.jsx`
7. `QuestLinkControls.jsx`
8. `RoleAssignment.jsx`
9. `LinkToQuestModal.jsx`
10. `PostTypeTag.jsx`
11. `threadstructures/ThreadList.jsx`

---

## 🔁 Board Behavior Logic

* If 1 item on board → display that item’s structure view
* If multiple items → use board’s structure setting (list, grid, scroll)
* If item is a thread → show timeline or reply thread depending on context
* Quest boards = boards with post items linked to a quest root post
* Quest logs = threads embedded in quest boards

---

## 🧠 Interaction Model

| Element | Primary Role                | Interaction Modes       |
| ------- | --------------------------- | ----------------------- |
| Post    | Atomic content/message unit | Reply, Like, Link       |
| Thread  | Grouped discussion/posts    | Timeline, Threaded view |
| Quest   | Collection of linked posts  | Log, Map, Subtasks      |
| Board   | Container of items          | Filters, Layout switch  |

---

## 🌱 Philosophy

> Boards display items. Items can contain structure. Structure becomes the view.

This approach lets the app scale from social interaction → collaborative work → deep project tracking without changing the core UX language.

---

## 📌 Next Steps

* Begin with `contexts/`&#x20;
* then `pages/` 
* then `components/` 
* then `backend/` 
* start with boards/structuresuest/mapstructures, post/structure component structures
* Build `Board.jsx` to adapt based on item count and structure
* Complete `QuestBoardMap.jsx` to visualize structure from post links
* Replace `PostTimeline` with board-based layout
* Introduce thread-aware rendering for logs and replies

---

Let me know when ready to begin each file. I’ll guide the child components from the root upward. ✨
