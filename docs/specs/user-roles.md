# Spec: user roles

Status: approved, not started

## Problem

Every signed-in user can do everything. Anyone can delete any project, and
there is no way to give a contractor read-only access. Support has had two
"someone deleted our project" tickets this month.

## Roles

| Role     | View projects and team | Create projects | Delete projects | Change roles |
| -------- | ---------------------- | --------------- | --------------- | ------------ |
| `admin`  | yes                    | yes             | yes             | yes          |
| `member` | yes                    | yes             | no              | no           |
| `viewer` | yes                    | no              | no              | no           |

## Requirements

### Schema

- Add a new migration `db/migrations/002_user_roles.sql`. Do not edit `001_init.sql`.
- `users.role` is `TEXT NOT NULL DEFAULT 'member'` and must be one of
  `admin`, `member`, `viewer` (enforce it in the database with a `CHECK`).
- On an existing database, the migration makes user 1 an `admin` and leaves
  everyone else as `member`.
- Update the seed data so a fresh database has Ada (id 1) as `admin`, Grace
  (id 2) as `member` and Linus (id 3) as `viewer`.

### API

- `GET /api/me` and `GET /api/users` include `role` for each user.
- `PATCH /api/users/:id/role` with body `{ "role": "viewer" }` changes a role.
  - Only admins may call it. Others get `403`.
  - Unknown roles get `400`. Unknown users get `404`.
  - Demoting the last remaining admin gets `409`.
  - Returns `200` with the updated user.
- `POST /api/projects` returns `403` for viewers.
- `DELETE /api/projects/:id` returns `403` for members and viewers.
- All `403` responses use the body `{ "error": "forbidden" }`.

### UI

- The Team page shows a role badge next to every user.
- Admins see a role picker for each user on the Team page. Changing it calls
  `PATCH /api/users/:id/role`. Other users do not see the picker.
- The Projects page hides the **New project** form from viewers and hides
  **Delete** buttons from anyone who is not an admin. The API still enforces the
  rules; hiding buttons is only for clarity.

## Acceptance criteria

The criteria are listed as `test.todo` entries in `test/roles.test.js`.

1. `users.role` exists, defaults to `member`, and only allows `admin`, `member` or `viewer`.
2. After migrating, Ada (id 1) is `admin`, Grace (id 2) is `member`, Linus (id 3) is `viewer`.
3. `GET /api/me` and `GET /api/users` include each user's role.
4. `PATCH /api/users/:id/role` is admin only (`403` otherwise) and rejects unknown roles (`400`).
5. The last admin cannot be demoted (`409`).
6. Viewers get `403` from `POST /api/projects`. Admins and members can create.
7. Only admins can `DELETE /api/projects/:id`. Members and viewers get `403`.
8. The Team page shows a role badge for every user, and admins get a role picker.
9. The Projects page hides **New project** from viewers and **Delete** from non-admins.
