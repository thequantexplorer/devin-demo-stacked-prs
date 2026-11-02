const { openDb } = require('./db');
const { createApp } = require('./app');

const port = Number(process.env.PORT) || 4600;
createApp(openDb()).listen(port, () => {
  console.log(`acme-projects listening on http://localhost:${port}`);
});
