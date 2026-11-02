const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

function migrate(db) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)');
  const applied = new Set(db.prepare('SELECT name FROM schema_migrations').pluck().all());
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
    })();
  }
}

function seed(db) {
  if (db.prepare('SELECT COUNT(*) FROM users').pluck().get() > 0) return;
  const addUser = db.prepare('INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)');
  const addProject = db.prepare('INSERT INTO projects (id, name, owner_id) VALUES (?, ?, ?)');
  db.transaction(() => {
    addUser.run(1, 'ada@acme.test', 'Ada Lovelace', 'admin');
    addUser.run(2, 'grace@acme.test', 'Grace Hopper', 'member');
    addUser.run(3, 'linus@acme.test', 'Linus Torvalds', 'viewer');
    addProject.run(1, 'Website redesign', 1);
    addProject.run(2, 'Billing v2', 2);
    addProject.run(3, 'Mobile app', 2);
  })();
}

function openDb(file = process.env.DB_FILE || 'acme.db') {
  const db = new Database(file);
  db.pragma('foreign_keys = ON');
  migrate(db);
  seed(db);
  return db;
}

module.exports = { openDb, migrate };
