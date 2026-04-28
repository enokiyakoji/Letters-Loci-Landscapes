export async function onRequest(context) {
  const { request, env, params } = context;
  const id = Number(params.id);

  if (request.method !== 'PUT') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminKey = request.headers.get('x-admin-key');
  if (!adminKey || adminKey !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action } = await request.json();
    if (!['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const submissions = env.SUBMISSIONS_KV
      ? JSON.parse((await env.SUBMISSIONS_KV.get('submissions_data')) || '{"nextId":1001,"items":[]}')
      : { nextId: 1001, items: [] };

    const entry = submissions.items.find((s) => s.id === id);
    if (!entry) {
      return new Response(JSON.stringify({ error: 'Submission not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    entry.status = action === 'approve' ? 'approved' : 'rejected';
    entry.reviewedAt = new Date().toISOString();

    if (env.SUBMISSIONS_KV) {
      await env.SUBMISSIONS_KV.put('submissions_data', JSON.stringify(submissions));
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
