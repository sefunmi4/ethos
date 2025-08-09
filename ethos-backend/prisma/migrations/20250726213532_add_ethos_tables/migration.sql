-- Create tables with lowercase plural names
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT,
    password TEXT NOT NULL,
    role TEXT,
    status TEXT
);

CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    authorId TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quests (
    id TEXT PRIMARY KEY,
    authorId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    visibility TEXT NOT NULL,
    approvalStatus TEXT,
    status TEXT,
    projectId TEXT,
    headPostId TEXT UNIQUE,
    linkedPosts JSONB,
    collaborators JSONB,
    gitRepo JSONB,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tags TEXT[],
    displayOnBoard BOOLEAN,
    defaultBoardId TEXT,
    taskGraph JSONB,
    helpRequest BOOLEAN,
    followers TEXT[]
);

CREATE TABLE boards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    boardType TEXT NOT NULL,
    layout TEXT NOT NULL,
    items JSONB NOT NULL,
    filters JSONB,
    featured BOOLEAN,
    defaultFor TEXT,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category TEXT,
    userId TEXT NOT NULL,
    questId TEXT
);

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    authorId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    visibility TEXT NOT NULL,
    status TEXT,
    tags TEXT[],
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    questIds TEXT[],
    deliverables TEXT[],
    mapEdges JSONB
);

CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    reviewerId TEXT NOT NULL,
    targetType TEXT NOT NULL,
    rating INTEGER NOT NULL,
    visibility TEXT NOT NULL,
    status TEXT NOT NULL,
    tags TEXT[],
    feedback TEXT,
    repoUrl TEXT,
    modelId TEXT,
    questId TEXT,
    postId TEXT,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX users_email_key ON users(email);
CREATE UNIQUE INDEX quests_headPostId_key ON quests(headPostId);

-- Foreign keys
ALTER TABLE posts ADD CONSTRAINT posts_authorId_fkey FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE quests ADD CONSTRAINT quests_authorId_fkey FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE quests ADD CONSTRAINT quests_projectId_fkey FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE quests ADD CONSTRAINT quests_headPostId_fkey FOREIGN KEY (headPostId) REFERENCES posts(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE boards ADD CONSTRAINT boards_userId_fkey FOREIGN KEY (userId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE boards ADD CONSTRAINT boards_questId_fkey FOREIGN KEY (questId) REFERENCES quests(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE projects ADD CONSTRAINT projects_authorId_fkey FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewerId_fkey FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_questId_fkey FOREIGN KEY (questId) REFERENCES quests(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_postId_fkey FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT notifications_userId_fkey FOREIGN KEY (userId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;
