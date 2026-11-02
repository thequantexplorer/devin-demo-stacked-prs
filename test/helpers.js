const { openDb } = require('../src/db');
const { createApp } = require('../src/app');

// Starts the app on a random port with a fresh in-memory database.
async function startServer() {
  const db = openDb(':memory:');
  const server = createApp(db).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  async function request(method, path, { as, body } = {}) {
    const headers = {};
    if (as) headers['x-user-id'] = String(as);
    if (body) headers['content-type'] = 'application/json';
    const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = undefined; }
    return { status: res.status, json, text, headers: res.headers };
  }

  return { db, request, close: () => new Promise((resolve) => server.close(resolve)) };
}

module.exports = { startServer };
