const express = require('express');
const { listUsers } = require('../users');
const { listProjects } = require('../projects');
const { projectsPage, teamPage, signInPage } = require('../views');

function pagesRouter(db) {
  const router = express.Router();

  router.get('/login/:id', (req, res) => {
    res.cookie('uid', String(Number(req.params.id)), { httpOnly: true, sameSite: 'lax' });
    res.redirect('/');
  });

  router.use((req, res, next) => {
    if (!req.user) return res.send(signInPage(listUsers(db)));
    next();
  });

  router.get('/', (req, res) => res.send(projectsPage(req.user, listProjects(db))));
  router.get('/team', (req, res) => res.send(teamPage(req.user, listUsers(db))));

  return router;
}

module.exports = { pagesRouter };
