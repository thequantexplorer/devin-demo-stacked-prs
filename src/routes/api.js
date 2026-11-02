const express = require('express');
const { requireUser, requireRole } = require('../auth');
const { ROLES, listUsers, getUser, countAdmins, setUserRole } = require('../users');
const { listProjects, createProject, deleteProject } = require('../projects');

function apiRouter(db) {
  const router = express.Router();
  router.use(express.json());
  router.use(requireUser);

  router.get('/me', (req, res) => res.json(req.user));

  router.get('/users', (req, res) => res.json(listUsers(db)));

  router.patch('/users/:id/role', requireRole('admin'), (req, res) => {
    const role = req.body?.role;
    if (!ROLES.includes(role)) return res.status(400).json({ error: `role must be one of ${ROLES.join(', ')}` });
    const user = getUser(db, Number(req.params.id));
    if (!user) return res.status(404).json({ error: 'not found' });
    if (user.role === 'admin' && role !== 'admin' && countAdmins(db) === 1) {
      return res.status(409).json({ error: 'cannot demote the last admin' });
    }
    res.json(setUserRole(db, user.id, role));
  });

  router.get('/projects', (req, res) => res.json(listProjects(db)));

  router.post('/projects', requireRole('admin', 'member'), (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name) return res.status(400).json({ error: 'name is required' });
    res.status(201).json(createProject(db, { name, ownerId: req.user.id }));
  });

  router.delete('/projects/:id', requireRole('admin'), (req, res) => {
    if (!deleteProject(db, Number(req.params.id))) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  });

  return router;
}

module.exports = { apiRouter };
