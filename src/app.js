const path = require('node:path');
const express = require('express');
const { currentUser } = require('./auth');
const { apiRouter } = require('./routes/api');
const { pagesRouter } = require('./routes/pages');

function createApp(db) {
  const app = express();
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(currentUser(db));
  app.use('/api', apiRouter(db));
  app.use('/', pagesRouter(db));
  return app;
}

module.exports = { createApp };
