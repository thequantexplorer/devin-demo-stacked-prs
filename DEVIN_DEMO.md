# Devin demo: Break a large feature into stacked PRs

**What it shows:** Devin builds one feature (user roles) across the schema, the
API and the UI, and ships it as a [stack](https://docs.devin.ai/work-with-devin/stacked-prs)
of small pull requests. Each PR builds on the one below it, shows only its own
change, and passes CI on its own.

**Needs:** GitHub only. Stacked PRs work on github.com repositories only.

More demos: [devin-advanced-demos](https://github.com/thequantexplorer/devin-advanced-demos)

## The starting problem

Every signed-in user can do everything. Today Linus (user 3) can delete any
project:

```text
$ curl -i -X DELETE localhost:4600/api/projects/1 -H 'X-User-Id: 3'
HTTP/1.1 204 No Content
```

The fix is written up in [docs/specs/user-roles.md](docs/specs/user-roles.md).
Its nine acceptance criteria are `test.todo` entries in `test/roles.test.js`,
so the test run reports them as not built yet:

```text
$ npm test
...
# tests 24
# pass 15
# fail 0
# todo 9
```

The feature touches a migration, the seed data, the API, the auth checks, two
pages and the tests. As one PR that is a lot to review at once.

## Set it up

1. Click **Use this template → Create a new repository**, choose your GitHub
   account or org as the owner, and keep the name `devin-demo-stacked-prs`. The
   links and prompt below assume that name. Use the template rather than a fork:
   pull requests on a fork go to the original repo by default.
2. In Devin, open [**Settings → Connections → GitHub**](https://app.devin.ai/settings/connections/github)
   and make sure Devin can access the new repository.

## Prompt

Start a new Devin session and paste this. Replace `<you>` with your GitHub user or org.

```text
Implement the user roles spec in docs/specs/user-roles.md on https://github.com/<you>/devin-demo-stacked-prs end to end: schema, API, UI and tests. Ship it as a stack of small PRs, not one big PR (https://docs.devin.ai/work-with-devin/stacked-prs).

Before you write code, post the plan for the stack. Use three layers, each on its own branch on top of the one below:
1. Schema: migration 002_user_roles.sql and roles in the seed data. Tests for AC1 and AC2.
2. API: role in /api/me and /api/users, PATCH /api/users/:id/role, and the 403 checks on creating and deleting projects. Tests for AC3 to AC7.
3. UI: role badges and the admin role picker on the Team page, and hiding New project and Delete on the Projects page. Tests for AC8 and AC9.

Rules for every layer:
- Keep it small and focused on that layer. It must pass npm test and the GitHub Actions CI on its own.
- Replace the matching test.todo entries in test/roles.test.js with real tests in the layer that builds them. Update existing tests only when the spec changes the behavior they check.
- The bottom PR targets main. Each PR above targets the branch of the PR below it. Group the PRs into one stack on GitHub.
- Write each PR description for a reviewer who only reads that layer.

Wait until CI is green on every PR in the stack and fix anything that fails. Do not merge. When you are done, reply with a table: layer, PR link, what it changes, tests added, CI status.
```

## What to watch

- Devin posts the plan for the stack before it writes any code.
- Each PR is diffed against the PR below it, so it shows only its own layer.
- A stack card appears in the session once the PRs are grouped.

## What done looks like

- Three PRs in one stack. The bottom one targets `main`, and each one above
  targets the branch below it.
- Every PR has a green CI check. On the top PR, `npm test` reports `# todo 0`.
- Nothing was merged.
