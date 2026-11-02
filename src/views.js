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

function projectsPage(user, projects) {
  const rows = projects
    .map(
      (p) => `      <li data-project-id="${p.id}">
        <span>${escape(p.name)}</span> <small>${escape(p.ownerName)}</small>
        <button data-action="delete-project" data-id="${p.id}">Delete</button>
      </li>`
    )
    .join('\n');
  return layout(
    user,
    'Projects',
    `    <form id="new-project">
      <input name="name" placeholder="Project name" required>
      <button type="submit">New project</button>
    </form>
    <ul class="projects">
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
      </tr>`
    )
    .join('\n');
  return layout(
    user,
    'Team',
    `    <table class="team">
      <thead><tr><th>Name</th><th>Email</th></tr></thead>
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
