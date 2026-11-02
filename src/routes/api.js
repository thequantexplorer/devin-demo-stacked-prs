const express = require('express');
const { requireUser } = require('../auth');
const { listUsers } = require('../users');
const { listProjects, createProject, deleteProject } = require('../projects');

function apiRouter(db) {
  const router = express.Router();
  router.use(express.json());
  router.use(requireUser);

  router.get('/me', (req, res) => res.json(req.user));

  router.get('/users', (req, res) => res.json(listUsers(db)));

  router.get('/projects', (req, res) => res.json(listProjects(db)));

  router.post('/projects', (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name) return res.status(400).json({ error: 'name is required' });
    res.status(201).json(createProject(db, { name, ownerId: req.user.id }));
  });

  router.delete('/projects/:id', (req, res) => {
    if (!deleteProject(db, Number(req.params.id))) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  });

  return router;
}

module.exports = { apiRouter };
