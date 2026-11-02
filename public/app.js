async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: res.statusText }));
    alert(error || `Request failed (${res.status})`);
    return false;
  }
  return true;
}

document.getElementById('new-project')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = new FormData(e.target).get('name');
  if (await api('POST', '/api/projects', { name })) location.reload();
});

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action="delete-project"]');
  if (!btn) return;
  if (await api('DELETE', `/api/projects/${btn.dataset.id}`)) location.reload();
});

document.addEventListener('change', async (e) => {
  const picker = e.target.closest('[data-action="change-role"]');
  if (!picker) return;
  picker.disabled = true;
  await api('PATCH', `/api/users/${picker.dataset.id}/role`, { role: picker.value });
  location.reload();
});
