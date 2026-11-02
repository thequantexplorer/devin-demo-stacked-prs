const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers');

test('API', async (t) => {
  const app = await startServer();
  t.after(app.close);

  await t.test('requires a signed-in user', async () => {
    assert.equal((await app.request('GET', '/api/projects')).status, 401);
    assert.equal((await app.request('GET', '/api/projects', { as: 99 })).status, 401);
  });

  await t.test('GET /api/me returns the current user', async () => {
    const res = await app.request('GET', '/api/me', { as: 2 });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { id: 2, email: 'grace@acme.test', name: 'Grace Hopper' });
  });

  await t.test('GET /api/users lists the team', async () => {
    const res = await app.request('GET', '/api/users', { as: 1 });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json.map((u) => u.name), ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds']);
  });

  await t.test('POST /api/projects creates a project owned by the caller', async () => {
    const res = await app.request('POST', '/api/projects', { as: 3, body: { name: 'Kernel docs' } });
    assert.equal(res.status, 201);
    assert.equal(res.json.name, 'Kernel docs');
    assert.equal(res.json.ownerId, 3);
  });

  await t.test('POST /api/projects validates the name', async () => {
    const res = await app.request('POST', '/api/projects', { as: 1, body: { name: '  ' } });
    assert.equal(res.status, 400);
  });

  await t.test('DELETE /api/projects/:id deletes a project', async () => {
    assert.equal((await app.request('DELETE', '/api/projects/1', { as: 1 })).status, 204);
    assert.equal((await app.request('DELETE', '/api/projects/1', { as: 1 })).status, 404);
  });
});
