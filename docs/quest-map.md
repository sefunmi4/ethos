# Quest Map and Node IDs

Ethos represents every post in a quest with a **node ID**. Node IDs let the frontend draw task trees and link logs or issues to the right place in a quest map.

## Node ID format

A node ID has three parts:

```
Q:<quest-slug>:<segment><number>
```

- `<quest-slug>` – a lowercase slug made from the quest title (`Ethos` → `ethos`).
- `<segment>` – one letter describing the post type:
  - `T` – task or quest node
  - `L` – log entry
  - `C` – commit
  - `I` – issue
- `<number>` – a zero‑padded counter starting at `00` for each segment within a quest.

Example: the first task in the `Ethos` quest becomes `Q:ethos:T00`. A reply log on that task would be `Q:ethos:T00:L01`.

Node IDs are generated in [`nodeIdUtils.ts`](../ethos-backend/src/utils/nodeIdUtils.ts) when a post is created or its quest/link changes.

## Automatic root node

Every quest has a hidden root node. When a quest is created without a `headPostId`, the map starts from this automatic root. If a `headPostId` is set, edges originate from that post instead. New tasks link from the root (or head post) so that the map always has a starting point.

The first task created in a quest uses the node ID `T00`. Root logs or files should nest under this task, for example `Q:demo:T00:L00`.

## Posts and edges in the quest map

The `/api/quests/:id/map` endpoint returns:

- `nodes` – all posts belonging to the quest. Any post with a `questId` gets a node ID and appears in the map.
- `edges` – connections stored in the quest’s `taskGraph`. Each edge links a `from` node to a `to` node.

The frontend uses these nodes and edges to build the quest graph. Nodes without an incoming edge become roots in the visualization. Dragging nodes in the graph view calls `linkPostToQuest` to create or update edges.

## Map Graph view

Boards may use a force-directed layout by setting their layout to `map-graph`. Quest pages pass this layout to their map board so users can freely drag nodes around. The map graph uses `react-force-graph` under the hood.

