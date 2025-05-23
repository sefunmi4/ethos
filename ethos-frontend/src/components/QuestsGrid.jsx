
// contexts/
// ├── AuthContext.js                      # Current user, session, permissions
// ├── BoardContext.js                     # Current board, view mode, filters


// pages/
// ├── index.jsx                           # Home (post board w/ timeline filters)
// ├── profile.jsx                         # User board filtered to own posts
// ├── quest/[id].jsx                      # Quest overview (summary + structured map view)
// ├── post/[id].jsx                       # Single post full view
// ├── new.jsx                             # New post/task/request/idea
// ├── boards/[id].jsx                      # General board (post or quest projects)
// └── NotFound.jsx

// components/
// ├── boards/                               # Universal display + layout layer
// │   ├── Board.jsx                        # Core container: accepts items, structure, renderItem
// │   ├── BoardToolbar.jsx                 # Filter, view selector, sort mode
// │   ├── BoardAddItem.jsx                 # + Add modal or inline control
// │   ├── BoardItemCard.jsx                # Default renderer for any board item
// │   ├── BoardReplyThreadView.jsx         # Detailed reply thread per post
// │   ├── BoardStructureToggle.jsx         # UI for timeline ↔ thread view switch
// │   ├── structures/                      # Layout modes (e.g., todos, grids, carousels)
// │   │   ├── BoardItemList.jsx            # Vertical list
// │   │   ├── BoardItemGrid.jsx            # Responsive grid
// │   │   ├── BoardItemScroll.jsx          # Horizontal slider view
// │   │   └── index.js                     # Maps structure keys to components
// │   └── utils.js                         # Sorting, grouping, filters, status helpers
// ├── quests/                              # Quest = organized post collections
// │   ├── QuestCard.jsx                    # Mini card for dashboards or summaries
// │   ├── QuestSummaryHeader.jsx          # Title, metadata, status indicators
// │   ├── QuestBoardMap.jsx               # Quest-specific board view
// │   └── mapstructures/                  # Layouts for visualizing quest trees/lists
// │       ├── QuestList.jsx               # Flat todo/step list
// │       ├── QuestTree.jsx               # Parent-child breakdown
// │       ├── QuestGrid.jsx               # Visual card layout
// │       ├── QuestGraph.jsx               # Parent-child breakdown where cycles are allowed
// │       └── index.js                    # Quest map structure dispatcher
// ├── posts/                               # Atomic units — each is its own node
// │   ├── PostTypeTag.jsx                  # Badge (e.g., REQUEST, TASK, LOG)
// │   ├── LinkToQuestModal.jsx            # Add/link this post to quest/task
// │   ├── PostEditor/
// │   │   ├── index.jsx                   # Main creation UI
// │   │   ├── QuestLinkControls.jsx      # Link type/parent selector
// │   │   └── RoleAssignment.jsx         # Role tags/labels
// │   ├── PostCard/
// │   │   ├── index.jsx                  # Full post component
// │   │   ├── PostHeader.jsx
// │   │   ├── PostActions.jsx
// │   │   ├── PostFooterMenu.jsx
// │   │   └── PostMetaBar.jsx            # Tags, linked quests/tasks, visibility
// components/quests/QuestActivityView.jsx       # Filters & shows live quest changes

// backend/
// ├── routes/
// │   ├── posts.js                  # 📝 CRUD, replies, reposts
// │   ├── quests.js                 # 🧭 Logs, linking, collaborators
// │   ├── users.js                  # 🔐 Auth, get profile
// │   ├── collab.js                 # 🧑‍🤝‍🧑 Party, join/leave permissions
// │   └── boards.js                 # ✳️ Board CRUD + item management
// │
// ├── logic/
// │   ├── postFormatter.js          # ✳️ Enrich post with user actions, display hints
// │   ├── questFormatter.js         # ✳️ Add tree structure, member permissions
// │   └── permissionUtils.js        # 🔐 Checks: canEdit, canComment, etc.
// │
// └── data/
//     ├── posts.json
//     ├── quests.json
//     ├── boards.json               # ✳️ { id, title, type, items: [postId, questId], filters }
//     ├── users.json
//     └── collab.json               # Temporary party/guild structures




// components/
// ├── posts/                         # Post creation, display, interaction
// │   ├── PostCard/
// │   │   ├── index.jsx              # 📦 Post wrapper + layout
// │   │   ├── PostHeader.jsx         # 🧠 Author, timestamp, type
// │   │   ├── PostActions.jsx        # 💬 Reply, Like, Repost
// │   │   ├── PostFooterMenu.jsx     # ⋮ Edit, Delete, Share
// │   │   └── PostMetaBar.jsx        # ✳️ Tags, QuestLink, Status
// │   │   
// │   ├── PostEditor/
// │   │   ├── index.jsx              # ✏️ Main textarea + controls
// │   │   ├── QuestLinkControls.jsx  # ✳️ Quest toggle/select
// │   │   └── RoleAssignment.jsx     # ✳️ Role selector for tasks
// │   │
// │   ├── structures/  # 🛠️ Color/status helpers, group logic

// pages/
// ├── index.jsx                     # 🏠 Homepage: feed + featured boardquests
// ├── profile.jsx                   # 🧑 User dashboard: posts, quests, editor
// ├── quest/[id].jsx                # 📜 Quest dashboard: logs/tasks/board
// ├── post/[id].jsx                 # 🔍 Post permalink view (optional)
// ├── new.jsx                       # ✏️ Standalone post creation page
// └── boards/[id].jsx                # ✳️ Generic board viewer (public boards, forums, questboards)

// backend/
// ├── routes/
// │   ├── posts.js                  # 📝 CRUD, replies, reposts
// │   ├── quests.js                 # 🧭 Logs, linking, collaborators
// │   ├── users.js                  # 🔐 Auth, get profile
// │   ├── collab.js                 # 🧑‍🤝‍🧑 Party, join/leave permissions
// │   └── boards.js                 # ✳️ Board CRUD + item management
// │
// ├── logic/
// │   ├── postFormatter.js          # ✳️ Enrich post with user actions, display hints
// │   ├── questFormatter.js         # ✳️ Add tree structure, member permissions
// │   └── permissionUtils.js        # 🔐 Checks: canEdit, canComment, etc.
// │
// └── data/
//     ├── posts.json
//     ├── quests.json
//     ├── boards.json               # ✳️ { id, title, type, items: [postId, questId], filters }
//     ├── users.json
//     └── collab.json               # Temporary party/guild structures







// 📁 components/
// ├── posts/
// │   ├── PostCard/                   # Visual display of a single post
// │   │   ├── index.jsx
// │   │   ├── PostHeader.jsx
// │   │   ├── PostActions.jsx
// │   │   ├── PostFooterMenu.jsx
// │   │   └── PostMetaBar.jsx        // ✳️ Shows tags, quest info, etc.
// │   ├── PostEditor/
// │   │   ├── index.jsx
// │   │   ├── QuestLinkControls.jsx  // ✳️ Select quest, task/log toggle, sublabel
// │   │   └── RoleAssignment.jsx     // ✳️ For quest_task posts
// │   ├── PostList/
// │   │   ├── PostCardList.jsx
// │   │   ├── PostTimeline.jsx
// │   │   └── index.jsx
// │   ├── LinkToQuestModal.jsx
// │   ├── PostTypeTag.jsx            // ✳️ Shows styled badge: REQUEST, TASK, etc.
// │   └── utils.js

// ├── quests/
// │   ├── QuestCard.jsx
// │   ├── QuestBoardMap.jsx          // ✳️ Visual quest status board
// │   └── QuestSummaryHeader.jsx     // ✳️ Top title/description section

// ├── board
// │   ├── Board.jsx                  // ✳️ Generic board renderer
// │   ├── BoardToolbar.jsx           // ✳️ Filters, search, title
// │   ├── BoardItemCard.jsx          // ✳️ Display post/quest on board
// │   ├── BoardAddItem.jsx           // ✳️ + button with modal
// │   └── utils.js                   // Helpers (status color, ordering)

// 📁 pages/
// ├── index.jsx
// ├── profile.jsx
// ├── quest/[id].jsx
// ├── post/[id].jsx
// ├── new.jsx
// └── boards/[id].jsx                 // ✳️ General-purpose board viewer (e.g., group threads, planning)

// 📁 backend/
// ├── routes/
// │   ├── posts.js
// │   ├── quests.js
// │   ├── users.js
// │   ├── collab.js
// │   └── boards.js                 // ✳️ CRUD for boards and boardItems

// ├── logic/
// │   ├── postFormatter.js          // ✳️ Add userActions, metadata
// │   ├── questFormatter.js         // ✳️ Add logs, members, tree structure
// │   └── permissionUtils.js

// └── data/
//     ├── posts.json
//     ├── quests.json
//     ├── boards.json               // ✳️ Each board has list of boardItems
//     ├── users.json
//     └── collab.json





// // 📁 components/
// // Central UI layer. Each folder is scoped by domain (e.g., posts, quests, auth).

// components/
// ├── posts/
// │   ├── PostCard/
// │   │   ├── index.jsx         // Main visual wrapper with layout logic
// │   │   ├── PostHeader.jsx    // Title, timestamp, and user
// │   │   ├── PostActions.jsx   // Reply, Like, Repost buttons
// │   │   ├── PostFooterMenu.jsx// Edit, Delete, Share dropdown
// │   │   └── PostMetaBar.jsx   // Tags, quest links, quest status (optional)
// │   │
// │   ├── PostEditor/
// │   │   ├── index.jsx         // Full editor for all post types
// │   │   ├── QuestLinkControls.jsx // Quest select + type options
// │   │   └── RoleAssignment.jsx // Role tag selector for tasks
// │   │
// │   ├── PostList/
// │   │   ├── PostCardList.jsx  // Render list of posts
// │   │   ├── PostTimeline.jsx  // Filters, search, and feed layout
// │   │   └── index.jsx         // Shared logic or wrapper (optional)
// │   │
// │   ├── LinkToQuestModal.jsx // Modal for connecting post to quest
// │   ├── PostTypeTag.jsx      // Renders styled tag for type: REQUEST, TASK, etc.
// │   └── utils.js             // Formatters, permission helpers


// // 📁 pages/
// // Client route views with layout + data fetching logic (UI-level)

// pages/
// ├── index.jsx                // Home feed with timeline
// ├── profile.jsx              // User's posts, quests, profile info
// ├── quest/[id].jsx           // Quest dashboard with logs, tasks
// ├── post/[id].jsx            // Full post detail view (optional)
// └── new.jsx                  // Create new post (advanced usage)


// // 📁 backend/
// // REST API and utility logic for server behavior

// backend/
// ├── routes/
// │   ├── posts.js             // CRUD + reply + repost + filtered search
// │   ├── quests.js            // CRUD + link post + logs/tasks fetch
// │   ├── users.js             // Auth, identity, friend/party
// │   └── collab.js            // Party system, join/leave, permissions
// │
// ├── logic/
// │   ├── postFormatter.js     // Injects userActions, displayHints into posts
// │   ├── questFormatter.js    // Enriches quest object with logs, member info
// │   └── permissionUtils.js   // Reusable logic for canEdit, canLink, etc.
// │
// └── data/
//     ├── posts.json           // All post data
//     ├── quests.json          // All quests
//     ├── users.json           // User records
//     └── collab.json          // Temporary party/guild structures


// // 🔧 TO ADD or CHANGE
// // ✳️ = New file to create

// // ✅ Frontend components (in components/posts/)
// // ✳️ PostMetaBar.jsx — shows quest ID, timestamp, and any badges
// // ✳️ PostTypeTag.jsx — shows colored badge for post type
// // ✳️ QuestLinkControls.jsx — dropdown + label input inside editor
// // ✳️ RoleAssignment.jsx — button grid for task role selection
// // ✳️ LinkToQuestModal.jsx — already created, fine-tune styling/logic

// // ✅ Backend routes (in backend/routes/)
// // ✅ posts.js — add `GET /posts/:id`, `POST /posts/:id/replies`, and enrich `GET /posts`
// // ✅ quests.js — add `GET /quests/:id/logs`, `PATCH /quests/:id/link` if needed

// // ✅ Backend formatters (in backend/logic/)
// // ✳️ postFormatter.js — adds `userActions`, `displayHints`, etc. to raw post
// // ✳️ questFormatter.js — adds logs, tasks, status, user membership info

// // ✅ Data model additions
// // posts.json:
// // - add `referencePostId`, `parentPostId`, `assignedRoles` (for quest tasks)
// // quests.json:
// // - add `collaborators`, `logs`, `tasks`, `summary`


// // 🧠 Prompt idea:
// // "Help me implement the logic in postFormatter.js to compute userActions and displayHints for a given post and user"
// // "Help me define the route in quests.js to return quest logs and tasks enriched with permissions"
// // "Generate a PostTypeTag.jsx that uses color-coded labels based on type"

// // Let me know when you're ready and I’ll walk through file-by-file.



// │   │   ├── PostCardList.jsx       # 🧱 PostCard list renderer + optionalfilter bar
// │   │   ├── PostCardGrid.jsx       # 🧱 PostCard 2d grid renderer + optionalfilter bar
// │   │   └── index.jsx              # (optional) shared wrapper logic
// │   │
// │   ├── LinkToQuestModal.jsx       # 🔗 Link post to quest modal
// │   ├── PostTypeTag.jsx            # ✳️ Visual tag: REQUEST, TASK, etc.
// │   └── utils.js                   # 🛠️ Helpers (formatting, permissions)
// │
// ├── quests/
// │   ├── QuestCard.jsx              # 📘 Summary card (used in lists)
// │   ├── QuestBoardMap.jsx          # ✳️ Visual tree/status map
// │   └── QuestSummaryHeader.jsx     # ✳️ Title, status, collaborators, etc.
// │
// ├── board
// │   ├── Board.jsx                  # ✳️ General board viewer layout
// │   ├── BoardToolbar.jsx           # ✳️ Search, filters, board title
// │   ├── BoardItemCard.jsx          # ✳️ Display post/quest on board
// │   ├── BoardAddItem.jsx           # ✳️ "+ Add item" modal logic
// │   └── utils.js                 