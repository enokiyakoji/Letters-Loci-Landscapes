import express from 'express';
import cors from 'cors';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

const SUBMISSIONS_PATH = join(__dirname, 'submissions.json');
const BUILTIN_DATA_PATH = join(__dirname, '..', 'src', 'data', 'literaryFoods.json');

app.use(cors());
app.use(express.json());

// ===== 频率限制 =====
const rateMap = new Map(); // IP -> { count, windowStart }
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// 清理过期条目（每 10 分钟）
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (now - entry.windowStart > RATE_WINDOW) rateMap.delete(ip);
  }
}, 10 * 60 * 1000);

// ===== 读取数据 =====
async function getSubmissions() {
  try {
    const raw = await readFile(SUBMISSIONS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { nextId: 1001, items: [] };
  }
}

async function saveSubmissions(data) {
  await writeFile(SUBMISSIONS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function getBuiltinFoods() {
  const raw = await readFile(BUILTIN_DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

// ===== 管理认证 =====
function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ===== API 路由 =====

// 获取所有已发布的美食数据
app.get('/api/foods', async (_req, res) => {
  try {
    const builtin = await getBuiltinFoods();
    const submissions = await getSubmissions();
    const approved = submissions.items
      .filter((s) => s.status === 'approved')
      .map((s) => ({ id: s.id, ...s.data }));
    res.json([...builtin, ...approved]);
  } catch (err) {
    console.error('GET /api/foods error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 提交新投稿
app.post('/api/submissions', async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: '提交过于频繁，请稍后再试' });
    }

    const { city, country, region, lat, lng, food, book, author, excerpt, tags, website } = req.body;

    // Honeypot 检查
    if (website) {
      return res.status(201).json({ success: true }); // 静默丢弃
    }

    // 必填字段验证
    if (!city || !country || !food || !book || !author || !excerpt) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: '请提供有效的经纬度坐标' });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: '经纬度坐标超出范围' });
    }

    const submissions = await getSubmissions();
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
    await saveSubmissions(submissions);

    res.status(201).json({ success: true, id: entry.id });
  } catch (err) {
    console.error('POST /api/submissions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取所有投稿（管理员）
app.get('/api/submissions', requireAdmin, async (_req, res) => {
  try {
    const submissions = await getSubmissions();
    res.json(submissions.items);
  } catch (err) {
    console.error('GET /api/submissions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 审核投稿（管理员）
app.put('/api/submissions/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const submissions = await getSubmissions();
    const entry = submissions.items.find((s) => s.id === Number(id));
    if (!entry) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    entry.status = action === 'approve' ? 'approved' : 'rejected';
    entry.reviewedAt = new Date().toISOString();
    await saveSubmissions(submissions);

    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/submissions/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== 生产环境：提供静态文件 =====
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback (Express 5: use app.use instead of app.get('*'))
app.use((req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(distPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
