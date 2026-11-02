const test = require('node:test');
const assert = require('node:assert/strict');
const { openDb, migrate } = require('../src/db');

test('migrations run once and are recorded', () => {
  const db = openDb(':memory:');
  migrate(db);
  const applied = db.prepare('SELECT name FROM schema_migrations ORDER BY name').pluck().all();
  assert.equal(applied[0], '001_init.sql');
  assert.equal(new Set(applied).size, applied.length);
});

test('seed data is deterministic', () => {
  const db = openDb(':memory:');
  const users = db.prepare('SELECT id, email FROM users ORDER BY id').all();
  assert.deepEqual(users, [
    { id: 1, email: 'ada@acme.test' },
    { id: 2, email: 'grace@acme.test' },
    { id: 3, email: 'linus@acme.test' },
  ]);
  assert.equal(db.prepare('SELECT COUNT(*) FROM projects').pluck().get(), 3);
});
