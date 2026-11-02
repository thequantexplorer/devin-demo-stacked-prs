const { ROLES } = require('./users');

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function layout(user, title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escape(title)} · Acme Projects</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <strong>Acme Projects</strong>
    <nav><a href="/">Projects</a> <a href="/team">Team</a></nav>
    <span class="who">${user ? `Signed in as ${escape(user.name)}` : 'Not signed in'}</span>
  </header>
  <main>
    <h1>${escape(title)}</h1>
${body}
  </main>
  <script src="/app.js"></script>
</body>
</html>`;
}

// These only hide controls the user cannot use. The API enforces the same rules.
const canCreateProjects = (user) => user.role === 'admin' || user.role === 'member';
const canDeleteProjects = (user) => user.role === 'admin';
const canChangeRoles = (user) => user.role === 'admin';

function roleBadge(role) {
  return `<span class="role-badge role-${escape(role)}" data-role="${escape(role)}">${escape(role)}</span>`;
}

function rolePicker(u) {
  const options = ROLES.map((r) => `<option value="${r}"${r === u.role ? ' selected' : ''}>${r}</option>`).join('');
  return `<select data-action="change-role" data-id="${u.id}" aria-label="Role for ${escape(u.name)}">${options}</select>`;
}

function projectsPage(user, projects) {
  const deleteButton = (p) =>
    canDeleteProjects(user) ? `\n        <button data-action="delete-project" data-id="${p.id}">Delete</button>` : '';
  const rows = projects
    .map(
      (p) => `      <li data-project-id="${p.id}">
        <span>${escape(p.name)}</span> <small>${escape(p.ownerName)}</small>${deleteButton(p)}
      </li>`
    )
    .join('\n');
  const newProjectForm = canCreateProjects(user)
    ? `    <form id="new-project">
      <input name="name" placeholder="Project name" required>
      <button type="submit">New project</button>
    </form>
`
    : '';
  return layout(
    user,
    'Projects',
    `${newProjectForm}    <ul class="projects">
${rows}
    </ul>`
  );
}

function teamPage(user, users) {
  const rows = users
    .map(
      (u) => `      <tr data-user-id="${u.id}">
        <td>${escape(u.name)}</td>
        <td>${escape(u.email)}</td>
        <td>${roleBadge(u.role)}${canChangeRoles(user) ? ` ${rolePicker(u)}` : ''}</td>
      </tr>`
    )
    .join('\n');
  return layout(
    user,
    'Team',
    `    <table class="team">
      <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>`
  );
}

function signInPage(users) {
  const links = users.map((u) => `      <li><a href="/login/${u.id}">${escape(u.name)}</a></li>`).join('\n');
  return layout(null, 'Sign in', `    <p>Pick a demo user.</p>\n    <ul>\n${links}\n    </ul>`);
}

module.exports = { projectsPage, teamPage, signInPage };
