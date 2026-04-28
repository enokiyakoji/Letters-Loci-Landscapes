const API_BASE = '/api';

export async function fetchFoods() {
  const res = await fetch(`${API_BASE}/foods`);
  if (!res.ok) throw new Error('Failed to fetch foods');
  return res.json();
}

export async function submitEntry(data) {
  const res = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 429) {
    const body = await res.json();
    throw new Error(body.error || '提交过于频繁');
  }
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || '提交失败');
  }
  return res.json();
}

export async function fetchSubmissions(adminKey) {
  const res = await fetch(`${API_BASE}/submissions`, {
    headers: { 'x-admin-key': adminKey },
  });
  if (res.status === 401) throw new Error('密码错误');
  if (!res.ok) throw new Error('Failed to fetch submissions');
  return res.json();
}

export async function reviewSubmission(id, action, adminKey) {
  const res = await fetch(`${API_BASE}/submissions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || '审核失败');
  }
  return res.json();
}
