import { useState, useEffect, useRef } from 'react';
import { submitEntry, geocode } from '../api';
import './SubmitForm.css';

const INITIAL_FORM = { city: '', country: '', food: '', excerpt: '', website: '' };

function SubmitForm({ isOpen, onClose }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('idle'); // idle | geocoding | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [closing, setClosing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setStatus('idle');
      setErrorMsg('');
    }
    return () => clearTimeout(timerRef.current);
  }, [isOpen]);

  if (!isOpen && !closing) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleClose = () => {
    setClosing(true);
    timerRef.current = setTimeout(() => {
      onClose();
      setClosing(false);
      setForm(INITIAL_FORM);
      setStatus('idle');
      setErrorMsg('');
    }, 350);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('geocoding');
    setErrorMsg('');

    try {
      const { lat, lng } = await geocode(form.city, form.country);

      setStatus('submitting');

      const data = {
        city: form.city.trim(),
        country: form.country.trim(),
        region: '',
        lat,
        lng,
        food: form.food.trim(),
        book: '佚名',
        author: '佚名',
        excerpt: form.excerpt.trim(),
        tags: [],
        website: form.website,
      };

      await submitEntry(data);
      setStatus('success');
      timerRef.current = setTimeout(() => {
        handleClose();
      }, 2200);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || '提交失败，请稍后再试');
    }
  };

  return (
    <div className={`submit-panel${closing ? ' submit-panel--closing' : ''}`}>
      <button className="submit-panel-close" onClick={handleClose} aria-label="关闭">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      <h3 className="submit-panel-title">贡献美食记忆</h3>

      {status === 'success' ? (
        <div className="submit-panel-success">
          <svg className="submit-panel-check" width="44" height="44" viewBox="0 0 44 44" fill="none">
            <circle cx="22" cy="22" r="20" stroke="#8DA090" strokeWidth="2" opacity="0.3"/>
            <circle cx="22" cy="22" r="20" stroke="#8DA090" strokeWidth="2" strokeDasharray="126" strokeDashoffset="126" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" from="126" to="0" dur="0.6s" fill="freeze"/>
            </circle>
            <path d="M14 22l5 5 11-11" stroke="#8DA090" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset="24">
              <animate attributeName="stroke-dashoffset" from="24" to="0" dur="0.35s" begin="0.3s" fill="freeze"/>
            </path>
          </svg>
          <p>提交成功！</p>
          <span>等待管理员审核后显示在地图上</span>
        </div>
      ) : (
        <form className="submit-panel-form" onSubmit={handleSubmit}>
          <div className="submit-panel-row">
            <div className="submit-panel-field">
              <label>城市</label>
              <input name="city" value={form.city} onChange={handleChange} required placeholder="绍兴" />
            </div>
            <div className="submit-panel-field">
              <label>国家</label>
              <input name="country" value={form.country} onChange={handleChange} required placeholder="中国" />
            </div>
          </div>

          <div className="submit-panel-field">
            <label>美食</label>
            <input name="food" value={form.food} onChange={handleChange} required placeholder="茴香豆" />
          </div>

          <div className="submit-panel-field">
            <label>原文句子</label>
            <textarea name="excerpt" value={form.excerpt} onChange={handleChange} required placeholder="摘录书中描写美食的句子…" rows={3} />
          </div>

          {/* Honeypot */}
          <input name="website" value={form.website} onChange={handleChange} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

          {status === 'error' && <div className="submit-panel-error">{errorMsg}</div>}

          <button className="submit-panel-btn" type="submit" disabled={status === 'geocoding' || status === 'submitting'}>
            {status === 'geocoding' ? '查找位置中...' : status === 'submitting' ? '提交中...' : '提交投稿'}
          </button>
        </form>
      )}
    </div>
  );
}

export default SubmitForm;
