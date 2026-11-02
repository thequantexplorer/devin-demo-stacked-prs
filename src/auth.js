const { getUser } = require('./users');

// Demo sign-in: the X-User-Id header (API clients and tests) or the uid cookie (browser).
// Set the cookie by visiting /login/<id>.
function readUserId(req) {
  const header = req.get('x-user-id');
  if (header) return Number(header);
  const match = /(?:^|;\s*)uid=(\d+)/.exec(req.get('cookie') || '');
  return match ? Number(match[1]) : null;
}

function currentUser(db) {
  return (req, res, next) => {
    const id = readUserId(req);
    req.user = id ? getUser(db, id) || null : null;
    next();
  };
}

function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'sign in required' });
  next();
}

module.exports = { currentUser, requireUser };
