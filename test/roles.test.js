// Acceptance criteria from docs/specs/user-roles.md.
// Replace each test.todo with a real test as you implement it.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { openDb, migrate } = require('../src/db');
const { startServer } = require('./helpers');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');
const ADA = 1; // admin
const GRACE = 2; // member
const LINUS = 3; // viewer
const FORBIDDEN = { error: 'forbidden' };

// Starts a fresh app for one test and closes it when the test ends.
async function freshApp(t) {
  const app = await startServer();
  t.after(app.close);
  return app;
}

// A database that has only 001_init.sql applied, as it existed before roles shipped.
function preRolesDb() {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE schema_migrations (name TEXT PRIMARY KEY)');
  db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, '001_init.sql'), 'utf8'));
  db.prepare("INSERT INTO schema_migrations (name) VALUES ('001_init.sql')").run();
  const addUser = db.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?)');
  addUser.run(1, 'ada@acme.test', 'Ada Lovelace');
  addUser.run(2, 'grace@acme.test', 'Grace Hopper');
  addUser.run(3, 'linus@acme.test', 'Linus Torvalds');
  return db;
}

test('AC1: users.role exists, defaults to member, and only allows admin, member or viewer', () => {
  const db = openDb(':memory:');
  const role = db.prepare('PRAGMA table_info(users)').all().find((c) => c.name === 'role');
  assert.ok(role, 'users.role column exists');
  assert.equal(role.type, 'TEXT');
  assert.equal(role.notnull, 1);

  db.prepare("INSERT INTO users (id, email, name) VALUES (10, 'new@acme.test', 'New User')").run();
  assert.equal(db.prepare('SELECT role FROM users WHERE id = 10').pluck().get(), 'member');

  for (const [i, ok] of ['admin', 'member', 'viewer'].entries()) {
    db.prepare('INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)').run(20 + i, `${ok}@acme.test`, ok, ok);
  }
  assert.throws(
    () => db.prepare("INSERT INTO users (id, email, name, role) VALUES (30, 'x@acme.test', 'X', 'owner')").run(),
    /CHECK constraint failed/
  );
  assert.throws(() => db.prepare("UPDATE users SET role = 'superuser' WHERE id = 1").run(), /CHECK constraint failed/);
  assert.throws(() => db.prepare('UPDATE users SET role = NULL WHERE id = 1').run(), /NOT NULL constraint failed/);
});

test('AC2: after migrating, Ada (id 1) is admin, Grace (id 2) is member, Linus (id 3) is viewer', async (t) => {
  await t.test('fresh database gets roles from the seed data', () => {
    const db = openDb(':memory:');
    assert.deepEqual(db.prepare('SELECT id, role FROM users ORDER BY id').all(), [
      { id: 1, role: 'admin' },
      { id: 2, role: 'member' },
      { id: 3, role: 'viewer' },
    ]);
  });

  await t.test('existing database makes user 1 admin and everyone else member', () => {
    const db = preRolesDb();
    migrate(db);
    assert.deepEqual(db.prepare('SELECT id, role FROM users ORDER BY id').all(), [
      { id: 1, role: 'admin' },
      { id: 2, role: 'member' },
      { id: 3, role: 'member' },
    ]);
    assert.ok(db.prepare('SELECT name FROM schema_migrations').pluck().all().includes('002_user_roles.sql'));
  });
});

test("AC3: GET /api/me and GET /api/users include each user's role", async (t) => {
  const app = await freshApp(t);
  for (const [id, role] of [[ADA, 'admin'], [GRACE, 'member'], [LINUS, 'viewer']]) {
    const me = await app.request('GET', '/api/me', { as: id });
    assert.equal(me.status, 200);
    assert.equal(me.json.role, role);
  }
  const users = await app.request('GET', '/api/users', { as: LINUS });
  assert.equal(users.status, 200);
  assert.deepEqual(users.json.map((u) => [u.id, u.role]), [[ADA, 'admin'], [GRACE, 'member'], [LINUS, 'viewer']]);
});

test('AC4: PATCH /api/users/:id/role is admin only (403 otherwise) and rejects unknown roles (400)', async (t) => {
  const app = await freshApp(t);
  const patch = (as, id, body) => app.request('PATCH', `/api/users/${id}/role`, { as, body });

  for (const as of [GRACE, LINUS]) {
    const res = await patch(as, LINUS, { role: 'member' });
    assert.equal(res.status, 403);
    assert.deepEqual(res.json, FORBIDDEN);
  }
  assert.equal((await patch(GRACE, GRACE, { role: 'admin' })).status, 403, 'members cannot promote themselves');

  for (const body of [{ role: 'owner' }, { role: '' }, {}, { role: ['admin'] }]) {
    assert.equal((await patch(ADA, LINUS, body)).status, 400, JSON.stringify(body));
  }
  assert.equal((await patch(ADA, 99, { role: 'viewer' })).status, 404);

  const res = await patch(ADA, LINUS, { role: 'member' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.json, { id: LINUS, email: 'linus@acme.test', name: 'Linus Torvalds', role: 'member' });
  assert.equal((await app.request('GET', '/api/me', { as: LINUS })).json.role, 'member');
});

test('AC5: the last admin cannot be demoted (409)', async (t) => {
  const app = await freshApp(t);
  const patch = (as, id, role) => app.request('PATCH', `/api/users/${id}/role`, { as, body: { role } });

  assert.equal((await patch(ADA, ADA, 'member')).status, 409);
  assert.equal((await patch(ADA, ADA, 'viewer')).status, 409);
  assert.equal((await app.request('GET', '/api/me', { as: ADA })).json.role, 'admin');
  assert.equal((await patch(ADA, ADA, 'admin')).status, 200, 'keeping the last admin as admin is fine');

  assert.equal((await patch(ADA, GRACE, 'admin')).status, 200);
  assert.equal((await patch(GRACE, ADA, 'member')).status, 200, 'an admin can be demoted while another remains');
  assert.equal((await patch(GRACE, GRACE, 'viewer')).status, 409);
});

test('AC6: viewers get 403 from POST /api/projects; admins and members can create', async (t) => {
  const app = await freshApp(t);
  const res = await app.request('POST', '/api/projects', { as: LINUS, body: { name: 'Viewer project' } });
  assert.equal(res.status, 403);
  assert.deepEqual(res.json, FORBIDDEN);

  for (const as of [ADA, GRACE]) {
    const created = await app.request('POST', '/api/projects', { as, body: { name: `Project by ${as}` } });
    assert.equal(created.status, 201);
    assert.equal(created.json.ownerId, as);
  }
  const names = (await app.request('GET', '/api/projects', { as: ADA })).json.map((p) => p.name);
  assert.ok(!names.includes('Viewer project'));
});

test('AC7: only admins can DELETE /api/projects/:id; members and viewers get 403', async (t) => {
  const app = await freshApp(t);
  // Project 2 is owned by Grace: owning a project does not let a member delete it.
  for (const as of [GRACE, LINUS]) {
    const res = await app.request('DELETE', '/api/projects/2', { as });
    assert.equal(res.status, 403);
    assert.deepEqual(res.json, FORBIDDEN);
  }
  assert.equal((await app.request('GET', '/api/projects', { as: ADA })).json.length, 3);
  assert.equal((await app.request('DELETE', '/api/projects/2', { as: ADA })).status, 204);
  assert.equal((await app.request('GET', '/api/projects', { as: ADA })).json.length, 2);
});

test.todo('AC8: the Team page shows a role badge for every user, and admins get a role picker');
test.todo('AC9: the Projects page hides New project from viewers and Delete from non-admins');
