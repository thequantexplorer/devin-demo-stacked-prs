// Acceptance criteria from docs/specs/user-roles.md. None of this is built yet.
// Replace each test.todo with a real test as you implement it.
const test = require('node:test');

test.todo('AC1: users.role exists, defaults to member, and only allows admin, member or viewer');
test.todo('AC2: after migrating, Ada (id 1) is admin, Grace (id 2) is member, Linus (id 3) is viewer');
test.todo('AC3: GET /api/me and GET /api/users include each user\'s role');
test.todo('AC4: PATCH /api/users/:id/role is admin only (403 otherwise) and rejects unknown roles (400)');
test.todo('AC5: the last admin cannot be demoted (409)');
test.todo('AC6: viewers get 403 from POST /api/projects; admins and members can create');
test.todo('AC7: only admins can DELETE /api/projects/:id; members and viewers get 403');
test.todo('AC8: the Team page shows a role badge for every user, and admins get a role picker');
test.todo('AC9: the Projects page hides New project from viewers and Delete from non-admins');
