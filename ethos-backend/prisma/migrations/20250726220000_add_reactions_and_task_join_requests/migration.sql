-- Create reactions and task_join_requests tables

CREATE TABLE reactions (
    id TEXT PRIMARY KEY,
    postId TEXT NOT NULL,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX reactions_postId_userId_type_key ON reactions(postId, userId, type);

CREATE TABLE task_join_requests (
    id TEXT PRIMARY KEY,
    taskId TEXT NOT NULL,
    requesterId TEXT NOT NULL,
    requestPostId TEXT,
    status TEXT NOT NULL,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decidedAt TIMESTAMP(3),
    decidedBy TEXT,
    meta JSONB
);
