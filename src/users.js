const ROLES = ['admin', 'member', 'viewer'];

function listUsers(db) {
  return db.prepare('SELECT id, email, name, role FROM users ORDER BY id').all();
}

function getUser(db, id) {
  return db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(id);
}

function countAdmins(db) {
  return db.prepare("SELECT COUNT(*) FROM users WHERE role = 'admin'").pluck().get();
}

function setUserRole(db, id, role) {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  return getUser(db, id);
}

module.exports = { ROLES, listUsers, getUser, countAdmins, setUserRole };
