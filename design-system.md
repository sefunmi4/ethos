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
3. `itemstructure/BoardItemCardList.jsx`
4. `itemstructure/BoardItemCardGrid.jsx`
5. `itemstructure/BoardItemCardScroll.jsx`
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
**Prompt: Designing Git Integration and Post Linkage in a Quest-Based Collaboration Platform**

---

**Objective:**
Integrate Git functionality, file structure syncing, post linkage propagation, and markdown-based commit visualization into a quest-based platform (e.g., Ethos/GuildQuest). The platform must support both developers and non-developers (creators, freelancers) while maintaining modularity and open-source compatibility.

---

**System Overview:**

1. **Quest = Project / Repository**

   * Each quest maps to a virtual project folder that may sync with a GitHub or GitLab repository.
   * If a GitHub repo is connected later, the backend listens for commits and updates.

2. **Task Nodes = Folders/Files**

   * Task nodes create real files/folders.
   * Nested nodes = folder structure.
   * Leaf nodes = files.
   * TODO comments in posts become inline TODOs in files.

3. **Posts = Logs / Commits / Instructions**

   * Freeform posts use markdown.
   * Posts linked to task nodes track changes, comments, instructions, or commits.
   * Quest logs and task-specific posts may auto-convert into file edits.

4. **Commits**

   * Each file edit generates a commit.
   * Commits are stored and rendered using markdown:

     ```
     changes: line 42 replaced with ...
     ...
     full file view toggle
     ```
   * Can push/pull from GitHub, fallback to local-only version.

5. **File Syncing and Versioning**

   * Frontend reflects file/folder structure based on the quest map.
   * Backend updates files on structure edits.
   * Git updates are listened to and propagated into post history.

6. **Post Linking and Propagation**

   * Solving a linked post (marked complete) updates others linked to it.
   * Updates cascade through linked requests/tasks.
   * Supports citation, solution similarity, and GitHub issue linking.

7. **Github Integration**

   * Upon login, user can link GitHub account.
   * GitHub repos converted to quests.

     * Issues = posts/quest logs
     * Commits = line/file edits
     * Project board = board layout
   * Forking = crosslinking to other quests
   * Merge PRs = tracking solved states

---

**Frontend Files to Update:**

* **LinkControls.tsx** – Allow linking of posts and nodes, track propagation
* **CreatePost.tsx / EditPost.tsx** – Add markdown preview, support TODO tracking
* **ContributionCard.tsx / PostCard.tsx** – Show commit diffs, line changes
* **GraphLayout.tsx / Board.tsx** – Visualize quest map as file tree or graph
* **CreateQuest.tsx / EditQuest.tsx** – Enable git repo init, sync controls
* **api/quest.ts / api/post.ts / api/git.ts** – Git actions, file change tracking
* **useQuest.ts / usePost.ts / useGit.ts (new)** – Hooks for syncing quest-file structure

---

**User Flow Integration:**

1. **User Registers**

   * Optional: Connect GitHub account

2. **User Creates Quest**

   * Initializes a repo/folder structure (option to download locally)
   * Design graph/tree of task nodes (creates folders/files)

3. **User Adds Posts**

   * Can tag lines, suggest TODOs, write logs
   * Markdown rendering
   * TODOs appear in code files

4. **User Commits or Edits**

   * Commits from GitHub or site update quest log
   * Shows line diffs, markdown descriptions

5. **Post Linking**

   * Link duplicate problems/requests
   * When marked solved, related posts update
   * Show influence or citation map (graph)

6. **Git Sync**

   * User pushes from local (or site pushes for them)
   * Pulls updates from GitHub when available
   * Dual remote repo support (GitHub + platform)

---

**Potential Implications:**

* Enables cross-project learning (solution graph)
* Promotes open collaboration (Git-powered wiki/log)
* Educates users through transparent changes
* Frees creators to focus on structure and content, not just code
* Supports advanced devs via Git CLI, beginners via GUI

---

**Future Add-ons:**

* Auto mark task complete when commit changes relevant file
* ChatGPT code assistant per file/task node
* Auto-detect cycles and patterns in graphs
* Visualization of influence & citation chain
* Git diff → markdown → post converter
* Peer-review workflows via post comments + review labels

Here’s a complete list of frontend files/folders that will need to be created or updated to support Git integration, quest-based file syncing, and post linkage propagation based on your detailed prompt.

⸻

✅ New Files to Create

src/api/git.ts
	•	Functions: pushToRepo, pullFromRepo, getGitDiff, syncWithGitRepo, linkGitRepoToQuest, getRepoFileTree

src/hooks/useGit.ts
	•	Wraps Git-related API calls with caching, polling, and error handling.
	•	Useful hooks: useGitRepo, useGitDiff, useGitFileTree, useRepoSync

⸻

📁 Files to Update by Feature Category

⸻

🔗 Post Linking & Propagation

To support linked post resolution and cascading updates:

Update:
	•	src/components/controls/LinkControls.tsx
→ Add linked post solving, relationship tagging (solution, citation, duplicate)
	•	src/components/post/PostCard.tsx
→ Show “linked to post X (solved)” badge
→ Option to view update history/citations
	•	src/hooks/usePost.ts
→ Add logic to useMarkPostAsSolved → triggers propagation
	•	src/api/post.ts
→ Add API calls like markPostSolved, getLinkedPosts, propagateSolution

⸻

📁 Quest = File Tree / Git Project

To reflect quests as Git-backed file structures:

Update:
	•	src/components/layout/GraphLayout.tsx
→ Render quest as file/folder tree
→ Add Git status indicators (modified, staged, committed)
	•	src/components/quest/CreateQuest.tsx / EditQuest.tsx
→ GitHub repo connect field
→ “Initialize Git structure” or “Sync Repo” button
	•	src/hooks/useQuest.ts
→ Add hook: useQuestFileTree, useQuestGitStatus
	•	src/api/quest.ts
→ Add: syncQuestStructureWithGit, getQuestRepoMeta, linkToGitRepo

⸻

📝 Commits & Markdown-Based Changes

To view diffs and track code changes from posts:

Update:
	•	src/components/post/CreatePost.tsx / EditPost.tsx
→ Git preview toggle
→ Markdown commit message formatter
	•	src/components/contribution/ContributionCard.tsx
→ Show diffs, file changed, commit summary
	•	src/components/post/PostCard.tsx
→ Show “changes: line 14 replaced…” style previews
	•	src/utils/displayUtils.ts
→ Add: formatGitDiffMarkdown(diffObj)

⸻

🌲 File Explorer / Task Tree

To map tasks and nodes to actual file structure:

Update:
	•	src/components/layout/GraphLayout.tsx
→ Visualize files/folders as nodes
→ Leaf = file, Parent = folder/task group
	•	src/hooks/useGraph.ts
→ Support Git structure-based node rendering
	•	src/types/questTypes.ts
→ Update Quest to include repo metadata:

repoUrl?: string;
fileTree?: QuestNode[]; // recursively represents folder structure



⸻

🧠 Types & Constants

Update:
	•	src/types/postTypes.ts
→ Add linkedPostIds: string[], solved: boolean, linkedType?: 'duplicate' | 'solution' | 'citation'
	•	src/types/questTypes.ts
→ Add Git fields: repoUrl, fileTree, commitHistory
	•	src/constants/options.ts
→ Add Git-related options and labels (e.g., post types: code_commit, issue, log)

⸻

📋 Boards and Views

To show task/quest maps as file trees and history logs:

Update:
	•	src/components/board/Board.tsx
→ Show toggle between “Graph View” and “File View”
	•	src/components/board/CreateBoard.tsx / EditBoard.tsx
→ Support filtering by file, tag, or node path

⸻

✅ Optional UX/UI Enhancements

Update:
	•	src/components/ui/Banner.tsx, AlertBox.tsx
→ Display “X linked posts have been updated based on this solution”
	•	src/components/ui/PostTypeBadge.tsx
→ New types: commit, solution, linked

⸻

🎯 Summary

Feature	Create	Update
Git Sync	api/git.ts, hooks/useGit.ts	useQuest.ts, CreateQuest.tsx, GraphLayout.tsx
Post Linking	–	LinkControls.tsx, PostCard.tsx, usePost.ts, post.ts
Markdown Commits	–	PostCard.tsx, ContributionCard.tsx, displayUtils.ts
File Tree	–	GraphLayout.tsx, questTypes.ts, useGraph.ts
Types	–	postTypes.ts, questTypes.ts, options.ts

Let me know if you want this scaffolded into a full git.ts API file or a frontend plan with checkbox items to track implementation.