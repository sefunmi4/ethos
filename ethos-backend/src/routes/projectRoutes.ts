import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import { projectsStore } from '../models/memoryStores';
import type { DBProject } from '../types/db';
import type { AuthenticatedRequest } from '../types/express';
import { pool, usePg } from '../db';

const router = express.Router();


// GET all projects
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  if (usePg) {
    try {
      const result = await pool.query('SELECT * FROM projects');
      res.json(result.rows);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
  const projects = projectsStore.read();
  res.json(projects);
});

// GET a single project
router.get('/:id', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  if (usePg) {
    try {
      const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
      const project = result.rows[0];
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.json(project);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
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
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (usePg) {
    const { title, description = '', visibility = 'public', tags = [] } = req.body;
    const authorId = req.user?.id;
    if (!authorId || !title) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const id = uuidv4();
    try {
      await pool.query(
        'INSERT INTO projects (id, authorid, title, description, visibility, tags) VALUES ($1,$2,$3,$4,$5,$6)',
        [id, authorId, title, description, visibility, JSON.stringify(tags)]
      );
      res.status(201).json({ id, authorId, title, description, visibility, tags });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
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
router.patch('/:id', authMiddleware, async (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  if (usePg) {
    try {
      const fields = Object.keys(req.body);
      const values = Object.values(req.body);
      if (fields.length > 0) {
        const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
        values.push(req.params.id);
        const result = await pool.query(`UPDATE projects SET ${sets} WHERE id = $${fields.length + 1} RETURNING *`, values);
        const row = result.rows[0];
        if (!row) {
          res.status(404).json({ error: 'Project not found' });
          return;
        }
        res.json(row);
        return;
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
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
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  if (usePg) {
    try {
      const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [req.params.id]);
      const row = result.rows[0];
      if (!row) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.json({ success: true });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
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
