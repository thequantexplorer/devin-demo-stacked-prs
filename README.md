# acme-projects

A small team project tracker. It has a JSON API, a server-rendered UI and a
SQLite database.

- `GET /api/me`, `GET /api/users`, `GET /api/projects`
- `POST /api/projects`, `DELETE /api/projects/:id`
- UI: Projects page (`/`) and Team page (`/team`)

Sign-in is a demo stub. API clients send an `X-User-Id` header. In the browser,
open `/login/<id>` to sign in as a seeded user (1 Ada, 2 Grace, 3 Linus).

```sh
npm install
npm test      # node:test, uses an in-memory database
npm start     # http://localhost:4600, data in acme.db
```

Schema changes go in a new numbered file in `db/migrations/`. Never edit a
migration that has already shipped.

CI (`.github/workflows/ci.yml`) runs `npm ci` and `npm test` on every pull
request, whatever branch it targets.

Next up: [user roles](docs/specs/user-roles.md).

---

This repo is a starter for a Devin demo. See [DEVIN_DEMO.md](DEVIN_DEMO.md) for setup and the prompt.
