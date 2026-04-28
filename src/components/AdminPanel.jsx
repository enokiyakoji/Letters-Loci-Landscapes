import { useState, useEffect } from 'react';
import { fetchSubmissions, reviewSubmission } from '../api';
import './AdminPanel.css';

function AdminPanel({ onBack }) {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('adminKey') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!sessionStorage.getItem('adminKey'));
  const [passwordInput, setPasswordInput] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // pending | approved | rejected

  useEffect(() => {
    if (isLoggedIn && adminKey) {
      loadSubmissions();
    }
  }, [isLoggedIn, adminKey]);

  const loadSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSubmissions(adminKey);
      setSubmissions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    const key = passwordInput.trim();
    setAdminKey(key);
    setIsLoggedIn(true);
    sessionStorage.setItem('adminKey', key);
    setPasswordInput('');
  };

  const handleReview = async (id, action) => {
    try {
      await reviewSubmission(id, action, adminKey);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: action === 'approve' ? 'approved' : 'rejected', reviewedAt: new Date().toISOString() }
            : s
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAdminKey('');
    sessionStorage.removeItem('adminKey');
    setSubmissions([]);
  };

  const filtered = submissions.filter((s) => s.status === filter);
  const counts = {
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-overlay">
        <div className="admin-login-card">
          <button className="admin-close" onClick={onBack} aria-label="返回">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 2L4 8l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="admin-title">管理登录</h2>
          <p className="admin-desc">请输入管理员密码以查看投稿</p>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="管理员密码"
              autoFocus
            />
            <button type="submit">登录</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <button className="admin-back" onClick={onBack} aria-label="返回地图">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 2L4 8l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="admin-title">投稿审核</h2>
          <button className="admin-logout" onClick={handleLogout}>退出</button>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${filter === 'pending' ? 'admin-tab--active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            待审核 {counts.pending > 0 && <span className="admin-badge">{counts.pending}</span>}
          </button>
          <button
            className={`admin-tab ${filter === 'approved' ? 'admin-tab--active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            已通过 {counts.approved}
          </button>
          <button
            className={`admin-tab ${filter === 'rejected' ? 'admin-tab--active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            已拒绝 {counts.rejected}
          </button>
        </div>

        <button className="admin-refresh" onClick={loadSubmissions} disabled={loading}>
          {loading ? '加载中...' : '刷新'}
        </button>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-list">
          {filtered.length === 0 ? (
            <div className="admin-empty">暂无{filter === 'pending' ? '待审核' : filter === 'approved' ? '已通过' : '已拒绝'}的投稿</div>
          ) : (
            filtered.map((s) => (
              <div key={s.id} className={`admin-item admin-item--${s.status}`}>
                <div className="admin-item-main">
                  <div className="admin-item-header">
                    <span className="admin-item-food">{s.data.food}</span>
                    <span className="admin-item-book">{s.data.book} / {s.data.author}</span>
                  </div>
                  <div className="admin-item-location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                      <circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    {s.data.city}，{s.data.country}
                  </div>
                  <div className="admin-item-excerpt">"{s.data.excerpt}"</div>
                  {s.data.tags.length > 0 && (
                    <div className="admin-item-tags">
                      {s.data.tags.map((t) => <span key={t} className="admin-item-tag">{t}</span>)}
                    </div>
                  )}
                  <div className="admin-item-meta">
                    提交于 {new Date(s.submittedAt).toLocaleString('zh-CN')}
                    {s.reviewedAt && ` · 审核于 ${new Date(s.reviewedAt).toLocaleString('zh-CN')}`}
                  </div>
                </div>

                {s.status === 'pending' && (
                  <div className="admin-item-actions">
                    <button
                      className="admin-action admin-action--approve"
                      onClick={() => handleReview(s.id, 'approve')}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      批准
                    </button>
                    <button
                      className="admin-action admin-action--reject"
                      onClick={() => handleReview(s.id, 'reject')}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      拒绝
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
