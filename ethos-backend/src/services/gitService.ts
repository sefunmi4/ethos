import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';
import simpleGit from 'simple-git';
import { gitStore } from '../models/stores';
import type { GitRepo, GitFileNode, GitFile } from '../types/api';

const reposRoot = path.join(__dirname, '../repos');

function ensureRepoDir(questId: string): string {
  const dir = path.join(reposRoot, questId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function initRepo(questId: string, name: string): Promise<GitRepo> {
  const repoDir = ensureRepoDir(questId);
  const repos = gitStore.read();
  const existing = repos.find((r) => (r as any).id === questId) as
    | GitRepo
    | undefined;
  const repo: GitRepo = existing ?? {
    id: questId,
    repoUrl: '',
    defaultBranch: 'main',
    branches: ['main'],
    lastCommitSha: '',
    status: {},
    fileTree: [],
    commits: [],
  };
  if (!existing) {
    repos.push(repo as any);
    gitStore.write(repos);
  }
  return repo;
}

function findNode(tree: GitFileNode[], parts: string[]): GitFileNode | null {
  if (parts.length === 0) return null;
  const [head, ...rest] = parts;
  const node = tree.find((n) => n.name === head);
  if (!node) return null;
  if (rest.length === 0) return node;
  if (!node.children) return null;
  return findNode(node.children, rest);
}

export async function createFolder(
  questId: string,
  folderPath: string
): Promise<GitRepo> {
  const repoDir = ensureRepoDir(questId);
  const target = path.join(repoDir, folderPath);
  fs.mkdirSync(target, { recursive: true });

  const repos = gitStore.read();
  const repo = repos.find((r) => (r as any).id === questId) as GitRepo | undefined;
  if (repo) {
    const parts = folderPath.split('/').filter(Boolean);
    let current = repo.fileTree;
    for (const part of parts) {
      let node = current.find((n) => n.name === part);
      if (!node) {
        node = {
          id: uuidv4(),
          path: part,
          name: part,
          type: 'dir',
          status: 'unchanged',
          children: [],
        };
        current.push(node);
      }
      if (!node.children) node.children = [];
      current = node.children;
    }
    gitStore.write(repos);
  }
  return repo as GitRepo;
}

export async function createFile(
  questId: string,
  filePath: string,
  content = ''
): Promise<GitRepo> {
  const repoDir = ensureRepoDir(questId);
  const target = path.join(repoDir, filePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);

  const repos = gitStore.read();
  const repo = repos.find((r) => (r as any).id === questId) as GitRepo | undefined;
  if (repo) {
    const parts = filePath.split('/').filter(Boolean);
    const fileName = parts.pop() as string;
    let parent = repo.fileTree;
    for (const part of parts) {
      let node = parent.find((n) => n.name === part && n.type === 'dir');
      if (!node) {
        node = {
          id: uuidv4(),
          path: part,
          name: part,
          type: 'dir',
          status: 'unchanged',
          children: [],
        };
        parent.push(node);
      }
      if (!node.children) node.children = [];
      parent = node.children;
    }
    parent.push({
      id: uuidv4(),
      path: filePath,
      name: fileName,
      type: 'file',
      status: 'added',
    });
    gitStore.write(repos);
  }
  return repo as GitRepo;
}

export async function updateFile(
  questId: string,
  filePath: string,
  content: string
): Promise<GitRepo> {
  const repoDir = ensureRepoDir(questId);
  const target = path.join(repoDir, filePath);
  fs.writeFileSync(target, content);

  const repos = gitStore.read();
  const repo = repos.find((r) => (r as any).id === questId) as GitRepo | undefined;
  if (repo) {
    const node = findNode(repo.fileTree, filePath.split('/').filter(Boolean));
    if (node) {
      node.status = 'modified';
    }
    gitStore.write(repos);
  }
  return repo as GitRepo;
}

export async function downloadRepo(
  questId: string,
  outPath: string
): Promise<string> {
  const repoDir = ensureRepoDir(questId);
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve());
    archive.on('error', (err: Error) => reject(err));
    archive.pipe(output);
    archive.directory(repoDir, false);
    archive.finalize();
  });
  return outPath;
}

// Placeholder implementations for existing functions
export async function getQuestRepoMeta(questId: string): Promise<GitRepo | null> {
  const repos = gitStore.read();
  const repo = repos.find((r) => (r as any).id === questId) as GitRepo | undefined;
  if (!repo) return null;
  const repoDir = ensureRepoDir(questId);
  const git = simpleGit(repoDir);
  try {
    const status = await git.status();
    const branchInfo = await git.branch();
    const log = await git.log({ maxCount: 1 });
    repo.status = {
      branch: status.current || undefined,
      ahead: status.ahead,
      behind: status.behind,
      isDirty: status.files.length > 0,
      uncommittedChanges: status.files.map((f) => ({
        path: typeof f === 'string' ? f : f.path,
        name: path.basename(typeof f === 'string' ? f : f.path),
        type: 'file',
        status: 'modified',
      } as GitFile)),
    };
    repo.branches = branchInfo.all;
    repo.lastCommitSha = log.latest?.hash || repo.lastCommitSha;
  } catch {
    // ignore git errors, return stored meta
  }
  return repo;
}

export async function connectRepo(
  questId: string,
  repoUrl: string,
  branch: string
): Promise<GitRepo> {
  const repoDir = ensureRepoDir(questId);
  const git = simpleGit();
  await git.clone(repoUrl, repoDir, ['--branch', branch]);
  const repoGit = simpleGit(repoDir);
  const branches = (await repoGit.branch()).all;
  const log = await repoGit.log({ maxCount: 1 });

  const repos = gitStore.read();
  let repo = repos.find((r) => (r as any).id === questId) as GitRepo | undefined;
  repo = {
    id: questId,
    repoUrl,
    defaultBranch: branch,
    branches,
    lastCommitSha: log.latest?.hash || '',
    status: {},
    fileTree: [],
    commits: [],
  };
  const idx = repos.findIndex((r) => (r as any).id === questId);
  if (idx >= 0) repos[idx] = repo as any;
  else repos.push(repo as any);
  gitStore.write(repos);
  return repo;
}

export async function syncRepo(questId: string): Promise<GitRepo> {
  const repoDir = ensureRepoDir(questId);
  const git = simpleGit(repoDir);
  await git.pull();
  return (await getQuestRepoMeta(questId)) as GitRepo;
}

export async function removeRepo(questId: string): Promise<{ success: boolean }> {
  const repos = gitStore.read();
  const idx = repos.findIndex((r) => (r as any).id === questId);
  if (idx !== -1) {
    repos.splice(idx, 1);
    gitStore.write(repos);
    const dir = path.join(reposRoot, questId);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  return { success: true };
}

export async function archiveHistory(questId: string): Promise<{ archiveUrl: string }> {
  const zipPath = path.join(reposRoot, `${questId}.zip`);
  await downloadRepo(questId, zipPath);
  return { archiveUrl: zipPath };
}

export async function getDiff(
  questId: string,
  filePath?: string,
  commitId?: string
): Promise<{ diffMarkdown: string }> {
  const repoDir = ensureRepoDir(questId);
  const git = simpleGit(repoDir);
  let diff = '';
  if (commitId) {
    const args = [commitId];
    if (filePath) args.push('--', filePath);
    diff = await git.show(args);
  } else if (filePath) {
    diff = await git.diff([filePath]);
  } else {
    diff = await git.diff();
  }
  return { diffMarkdown: diff };
}

export async function getFileTree(questId: string): Promise<{ files: string[]; folders: string[] }> {
  const repoDir = ensureRepoDir(questId);
  const files: string[] = [];
  const folders: string[] = [];
  function walk(dir: string) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      const rel = path.relative(repoDir, full);
      if (fs.statSync(full).isDirectory()) {
        folders.push(rel);
        walk(full);
      } else {
        files.push(rel);
      }
    }
  }
  walk(repoDir);
  return { files, folders };
}

export async function getCommits(questId: string): Promise<any[]> {
  const repoDir = ensureRepoDir(questId);
  const git = simpleGit(repoDir);
  const log = await git.log();
  return log.all.map((c) => ({
    id: c.hash,
    message: c.message,
    timestamp: c.date,
    author: { id: c.author_email, username: c.author_name },
  }));
}

export async function commitRepo(
  questId: string,
  message: string,
  filePaths: string[] = ['.']
): Promise<GitRepo> {
  const repoDir = ensureRepoDir(questId);
  const git = simpleGit(repoDir);
  await git.add(filePaths);
  await git.commit(message);
  return (await getQuestRepoMeta(questId)) as GitRepo;
}

export async function uploadRepoItem(
  questId: string,
  filePath: string,
  content: string,
  isFolder: boolean,
  message: string
): Promise<GitRepo> {
  if (isFolder) {
    await createFolder(questId, filePath);
  } else {
    await createFile(questId, filePath, content);
  }
  return commitRepo(questId, message, [filePath]);
}
