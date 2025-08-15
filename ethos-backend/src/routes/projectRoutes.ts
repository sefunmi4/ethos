import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import type { DBProject } from '../types/db';
import type { AuthenticatedRequest } from '../types/express';
import { pool } from '../db';

const router = express.Router();


// GET all projects
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM projects');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET a single project
router.get('/:id', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    const project = result.rows[0];
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// CREATE a new project
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH update a project
router.patch('/:id', authMiddleware, async (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }
    const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE projects SET ${sets} WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE a project
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [req.params.id]);
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET project map edges
router.get('/:id/map', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT mapEdges FROM projects WHERE id = $1', [req.params.id]);
    const project = result.rows[0];
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ edges: project.mapedges || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH update map edges
router.patch('/:id/map', authMiddleware, async (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const { edges } = req.body as { edges: DBProject['mapEdges'] };
  try {
    await pool.query('UPDATE projects SET mapEdges = $2 WHERE id = $1', [id, JSON.stringify(edges || [])]);
    const result = await pool.query('SELECT mapEdges FROM projects WHERE id = $1', [id]);
    res.json({ success: true, edges: result.rows[0]?.mapedges || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
