ALTER TABLE users
  ADD COLUMN role TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('admin', 'member', 'viewer'));

UPDATE users SET role = 'admin' WHERE id = 1;
