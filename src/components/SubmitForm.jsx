import { useState, useEffect } from 'react';
import { submitEntry } from '../api';
import './SubmitForm.css';

const INITIAL_FORM = {
  city: '', country: '', region: '',
  lat: '', lng: '',
  food: '', book: '', author: '',
  excerpt: '', tags: '',
  website: '', // honeypot
};

function SubmitForm({ isOpen, onClose, pickedCoords }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (pickedCoords) {
      setForm((f) => ({
        ...f,
        lat: pickedCoords.lat.toFixed(4),
        lng: pickedCoords.lng.toFixed(4),
      }));
    }
  }, [pickedCoords]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const data = {
        city: form.city,
        country: form.country,
        region: form.region,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        food: form.food,
        book: form.book,
        author: form.author,
        excerpt: form.excerpt,
        tags: form.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
        website: form.website,
      };

      await submitEntry(data);
      setStatus('success');
      setTimeout(() => {
        onClose();
        setForm(INITIAL_FORM);
        setStatus('idle');
      }, 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || '提交失败，请稍后再试');
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="submit-overlay" onClick={handleOverlayClick}>
      <div className="submit-card">
        <button className="submit-close" onClick={onClose} aria-label="关闭">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="submit-scroll">
          <h2 className="submit-title">贡献美食记忆</h2>
          <p className="submit-desc">分享您读到的文学美食，通过审核后将出现在地图上</p>

        {status === 'success' ? (
          <div className="submit-success">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="#8DA090" strokeWidth="2"/>
              <path d="M14 24l7 7 13-13" stroke="#8DA090" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>提交成功！感谢您的贡献</p>
          </div>
        ) : (
          <form className="submit-form" onSubmit={handleSubmit}>
            <div className="submit-field">
              <label>城市 *</label>
              <input name="city" value={form.city} onChange={handleChange} required placeholder="例如：绍兴" />
            </div>
            <div className="submit-row">
              <div className="submit-field">
                <label>国家 *</label>
                <input name="country" value={form.country} onChange={handleChange} required placeholder="例如：中国" />
              </div>
              <div className="submit-field">
                <label>地区</label>
                <input name="region" value={form.region} onChange={handleChange} placeholder="例如：浙江" />
              </div>
            </div>
            <div className="submit-row">
              <div className="submit-field">
                <label>纬度 *</label>
                <input name="lat" type="number" step="any" value={form.lat} onChange={handleChange} required placeholder="点击地图选取" />
              </div>
              <div className="submit-field">
                <label>经度 *</label>
                <input name="lng" type="number" step="any" value={form.lng} onChange={handleChange} required placeholder="点击地图选取" />
              </div>
            </div>
            <div className="submit-hint">在地图上点击可自动填入经纬度坐标</div>

            <div className="submit-field">
              <label>食物名称 *</label>
              <input name="food" value={form.food} onChange={handleChange} required placeholder="例如：茴香豆" />
            </div>
            <div className="submit-row">
              <div className="submit-field">
                <label>书名 *</label>
                <input name="book" value={form.book} onChange={handleChange} required placeholder="《孔乙己》" />
              </div>
              <div className="submit-field">
                <label>作者 *</label>
                <input name="author" value={form.author} onChange={handleChange} required placeholder="鲁迅" />
              </div>
            </div>
            <div className="submit-field">
              <label>原文引用 *</label>
              <textarea name="excerpt" value={form.excerpt} onChange={handleChange} required placeholder="请摘录书中与食物相关的原句" rows={3} />
            </div>
            <div className="submit-field">
              <label>标签</label>
              <input name="tags" value={form.tags} onChange={handleChange} placeholder="多个标签用逗号分隔：中国文学, 小说, 小吃" />
            </div>

            {/* Honeypot */}
            <input name="website" value={form.website} onChange={handleChange} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

            {status === 'error' && <div className="submit-error">{errorMsg}</div>}

            <button className="submit-btn" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? '提交中...' : '提交投稿'}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}

export default SubmitForm;
