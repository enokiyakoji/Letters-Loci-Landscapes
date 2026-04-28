import builtinData from '../../src/data/literaryFoods.json';

export async function onRequest(context) {
  const { env } = context;

  try {
    // 从 KV 读取已审核的投稿
    let approvedEntries = [];
    if (env.SUBMISSIONS_KV) {
      const raw = await env.SUBMISSIONS_KV.get('submissions_data');
      if (raw) {
        const submissions = JSON.parse(raw);
        approvedEntries = submissions.items
          .filter((s) => s.status === 'approved')
          .map((s) => ({ id: s.id, ...s.data }));
      }
    }

    const all = [...builtinData, ...approvedEntries];
    return new Response(JSON.stringify(all), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify(builtinData), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
