import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import { projectsStore } from '../models/stores';
import type { DBProject } from '../types/db';
import type { AuthenticatedRequest } from '../types/express';

const router = express.Router();

// GET all projects
router.get('/', (_req: Request, res: Response) => {
  const projects = projectsStore.read();
  res.json(projects);
});

// GET a single project
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const projects = projectsStore.read();
  const project = projects.find((p) => p.id === id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json(project);
});

// CREATE a new project
router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { title, description = '', visibility = 'public', tags = [] } = req.body;
  const authorId = req.user?.id;
  if (!authorId || !title) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const newProject: DBProject = {
    id: uuidv4(),
    authorId,
    title,
    description,
    visibility,
    approvalStatus: 'approved',
    status: 'active',
    tags,
    createdAt: new Date().toISOString(),
    questIds: [],
    headPostId: '',
    linkedPosts: [],
    quests: [],
    deliverables: [],
    mapEdges: [],
    collaborators: [],
  };
  const projects = projectsStore.read();
  projects.push(newProject);
  projectsStore.write(projects);
  res.status(201).json(newProject);
});

// PATCH update a project
router.patch('/:id', authMiddleware, (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const updates = req.body as Partial<DBProject>;
  const projects = projectsStore.read();
  const project = projects.find((p) => p.id === id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  Object.assign(project, updates);
  projectsStore.write(projects);
  res.json(project);
});

// DELETE a project
router.delete('/:id', authMiddleware, (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const projects = projectsStore.read();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  projects.splice(index, 1);
  projectsStore.write(projects);
  res.json({ success: true });
});

// GET project map edges
router.get('/:id/map', (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const projects = projectsStore.read();
  const project = projects.find((p) => p.id === id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ edges: project.mapEdges || [] });
});

// PATCH update map edges
router.patch('/:id/map', authMiddleware, (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const { edges } = req.body as { edges: DBProject['mapEdges'] };
  const projects = projectsStore.read();
  const project = projects.find((p) => p.id === id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  project.mapEdges = edges || [];
  projectsStore.write(projects);
  res.json({ success: true, edges: project.mapEdges });
});

export default router;
