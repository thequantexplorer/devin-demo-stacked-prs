function listUsers(db) {
  return db.prepare('SELECT id, email, name FROM users ORDER BY id').all();
}

function getUser(db, id) {
  return db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(id);
}

module.exports = { listUsers, getUser };
