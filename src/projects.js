function listProjects(db) {
  return db
    .prepare(
      `SELECT p.id, p.name, p.owner_id AS ownerId, u.name AS ownerName
         FROM projects p JOIN users u ON u.id = p.owner_id
        ORDER BY p.id`
    )
    .all();
}

function createProject(db, { name, ownerId }) {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO projects (name, owner_id) VALUES (?, ?)')
    .run(name, ownerId);
  return listProjects(db).find((p) => p.id === Number(lastInsertRowid));
}

function deleteProject(db, id) {
  return db.prepare('DELETE FROM projects WHERE id = ?').run(id).changes > 0;
}

module.exports = { listProjects, createProject, deleteProject };
