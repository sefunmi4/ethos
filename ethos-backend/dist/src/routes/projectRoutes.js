"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const authMiddleware_1 = require("../middleware/authMiddleware");
const stores_1 = require("../models/stores");
const router = express_1.default.Router();
// GET all projects
router.get('/', (_req, res) => {
    const projects = stores_1.projectsStore.read();
    res.json(projects);
});
// GET a single project
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const projects = stores_1.projectsStore.read();
    const project = projects.find((p) => p.id === id);
    if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
    }
    res.json(project);
});
// CREATE a new project
router.post('/', authMiddleware_1.authMiddleware, (req, res) => {
    const { title, description = '', visibility = 'public', tags = [] } = req.body;
    const authorId = req.user?.id;
    if (!authorId || !title) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    const newProject = {
        id: (0, uuid_1.v4)(),
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
    const projects = stores_1.projectsStore.read();
    projects.push(newProject);
    stores_1.projectsStore.write(projects);
    res.status(201).json(newProject);
});
// PATCH update a project
router.patch('/:id', authMiddleware_1.authMiddleware, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const projects = stores_1.projectsStore.read();
    const project = projects.find((p) => p.id === id);
    if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
    }
    Object.assign(project, updates);
    stores_1.projectsStore.write(projects);
    res.json(project);
});
// DELETE a project
router.delete('/:id', authMiddleware_1.authMiddleware, (req, res) => {
    const { id } = req.params;
    const projects = stores_1.projectsStore.read();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) {
        res.status(404).json({ error: 'Project not found' });
        return;
    }
    projects.splice(index, 1);
    stores_1.projectsStore.write(projects);
    res.json({ success: true });
});
// GET project map edges
router.get('/:id/map', (req, res) => {
    const { id } = req.params;
    const projects = stores_1.projectsStore.read();
    const project = projects.find((p) => p.id === id);
    if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
    }
    res.json({ edges: project.mapEdges || [] });
});
// PATCH update map edges
router.patch('/:id/map', authMiddleware_1.authMiddleware, (req, res) => {
    const { id } = req.params;
    const { edges } = req.body;
    const projects = stores_1.projectsStore.read();
    const project = projects.find((p) => p.id === id);
    if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
    }
    project.mapEdges = edges || [];
    stores_1.projectsStore.write(projects);
    res.json({ success: true, edges: project.mapEdges });
});
exports.default = router;
