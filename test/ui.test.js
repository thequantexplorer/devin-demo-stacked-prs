const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers');

test('UI', async (t) => {
  const app = await startServer();
  t.after(app.close);

  await t.test('shows the sign-in page when signed out', async () => {
    const res = await app.request('GET', '/');
    assert.match(res.text, /Pick a demo user/);
  });

  await t.test('/login/:id sets the uid cookie', async () => {
    const res = await app.request('GET', '/login/2');
    assert.equal(res.status, 302);
    assert.match(res.headers.get('set-cookie'), /uid=2/);
  });

  await t.test('projects page lists projects with delete buttons', async () => {
    const res = await app.request('GET', '/', { as: 1 });
    assert.match(res.text, /Signed in as Ada Lovelace/);
    assert.match(res.text, /Website redesign/);
    assert.equal((res.text.match(/data-action="delete-project"/g) || []).length, 3);
    assert.match(res.text, /id="new-project"/);
  });

  await t.test('team page lists every user', async () => {
    const res = await app.request('GET', '/team', { as: 1 });
    for (const name of ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds']) assert.match(res.text, new RegExp(name));
  });

  await t.test('escapes user content', async () => {
    await app.request('POST', '/api/projects', { as: 1, body: { name: '<script>x</script>' } });
    const res = await app.request('GET', '/', { as: 1 });
    assert.doesNotMatch(res.text, /<script>x<\/script>/);
    assert.match(res.text, /&lt;script&gt;x&lt;\/script&gt;/);
  });
});
