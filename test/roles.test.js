// Acceptance criteria from docs/specs/user-roles.md.
// Replace each test.todo with a real test as you implement it.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { openDb, migrate } = require('../src/db');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

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

test.todo('AC3: GET /api/me and GET /api/users include each user\'s role');
test.todo('AC4: PATCH /api/users/:id/role is admin only (403 otherwise) and rejects unknown roles (400)');
test.todo('AC5: the last admin cannot be demoted (409)');
test.todo('AC6: viewers get 403 from POST /api/projects; admins and members can create');
test.todo('AC7: only admins can DELETE /api/projects/:id; members and viewers get 403');
test.todo('AC8: the Team page shows a role badge for every user, and admins get a role picker');
test.todo('AC9: the Projects page hides New project from viewers and Delete from non-admins');
