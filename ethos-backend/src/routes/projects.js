import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/authMiddleware.js';
import authOptional from '../middleware/authOptional.js';
import { projectsStore, usersStore, postsStore } from '../utils/loaders.js';

const router = express.Router();

// GET all projects
router.get('/', (req, res) => {
  const projects = projectsStore.read();
  res.json(projects);
});

// CREATE new project
router.post('/', authMiddleware, (req, res) => {
  const { title, description = '', status = 'active', linkedPostId } = req.body;
  const authorId = req.user?.id;

  if (!authorId || !title) {
    return res.status(400).json({ error: 'Missing title or author' });
  }

  const projects = projectsStore.read();
  const newProject = {
    id: uuidv4(),
    authorId,
    title,
    description,
    status,
    linkedPostIds: linkedPostId ? [linkedPostId] : [],
    collaborators: [],
    createdAt: new Date().toISOString(),
  };

  projects.push(newProject);
  projectsStore.write(projects);
  res.status(201).json(newProject);
});

// LINK post to project
router.post('/:id/link', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { postId } = req.body;
  if (!postId) return res.status(400).json({ error: 'Missing postId' });

  const projects = projectsStore.read();
  const project = projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  project.linkedPostIds = project.linkedPostIds || [];
  if (!project.linkedPostIds.includes(postId)) {
    project.linkedPostIds.push(postId);
    projectsStore.write(projects);
  }

  res.json(project);
});

// GET single project
router.get('/:id', authOptional, (req, res) => {
  const { id } = req.params;
  const projects = projectsStore.read();
  const project = projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// UPDATE project (basic editing)
router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const projects = projectsStore.read();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  const userId = req.user?.id;
  const project = projects[index];
  if (project.authorId !== userId) return res.status(403).json({ error: 'Not authorized' });

  const { title, description, status, collaborators } = req.body;

  if (title) project.title = title;
  if (description) project.description = description;
  if (status) project.status = status;
  if (Array.isArray(collaborators)) project.collaborators = collaborators;

  projects[index] = project;
  projectsStore.write(projects);
  res.json(project);
});

// DELETE project
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const projects = projectsStore.read();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  const userId = req.user?.id;
  if (projects[index].authorId !== userId) return res.status(403).json({ error: 'Not authorized' });

  projects.splice(index, 1);
  projectsStore.write(projects);
  res.json({ message: 'Project deleted' });
});

export default router;