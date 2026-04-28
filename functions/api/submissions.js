export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  // POST - 提交新投稿
  if (method === 'POST') {
    return handleSubmit(request, env);
  }

  // GET - 管理员查看（需要密码）
  if (method === 'GET') {
    return handleList(request, env);
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleSubmit(request, env) {
  try {
    const body = await request.json();
    const { city, country, region, lat, lng, food, book, author, excerpt, tags, website } = body;

    // Honeypot
    if (website) {
      return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 必填验证
    if (!city || !country || !food || !book || !author || !excerpt) {
      return new Response(JSON.stringify({ error: '请填写所有必填字段' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response(JSON.stringify({ error: '请提供有效的经纬度坐标' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return new Response(JSON.stringify({ error: '经纬度坐标超出范围' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const submissions = env.SUBMISSIONS_KV
      ? JSON.parse((await env.SUBMISSIONS_KV.get('submissions_data')) || '{"nextId":1001,"items":[]}')
      : { nextId: 1001, items: [] };

    const entry = {
      id: submissions.nextId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      data: {
        city: String(city).trim(),
        country: String(country).trim(),
        region: String(region || '').trim(),
        lat: Number(lat),
        lng: Number(lng),
        food: String(food).trim(),
        book: String(book).trim(),
        author: String(author).trim(),
        excerpt: String(excerpt).trim(),
        tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      },
    };

    submissions.nextId++;
    submissions.items.push(entry);

    if (env.SUBMISSIONS_KV) {
      await env.SUBMISSIONS_KV.put('submissions_data', JSON.stringify(submissions));
    }

    return new Response(JSON.stringify({ success: true, id: entry.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleList(request, env) {
  const adminKey = request.headers.get('x-admin-key');
  if (!adminKey || adminKey !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const submissions = env.SUBMISSIONS_KV
    ? JSON.parse((await env.SUBMISSIONS_KV.get('submissions_data')) || '{"nextId":1001,"items":[]}')
    : { nextId: 1001, items: [] };

  return new Response(JSON.stringify(submissions.items), {
    headers: { 'Content-Type': 'application/json' },
  });
}
