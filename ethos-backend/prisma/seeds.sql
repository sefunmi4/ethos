INSERT INTO boards (id, title, boardType, layout, items, createdAt, userId)
VALUES
  ('quest-board', 'Quest Board', 'post', 'grid', '[]', NOW(), ''),
  ('timeline-board', 'Timeline', 'post', 'grid', '[]', NOW(), ''),
  ('my-posts', 'My Posts', 'post', 'grid', '[]', NOW(), ''),
  ('my-quests', 'My Quests', 'quest', 'grid', '[]', NOW(), '')
ON CONFLICT (id) DO NOTHING;
