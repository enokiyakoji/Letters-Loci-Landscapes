import './FoodCard.css';

function FoodCard({ food, isVisible, onClose }) {
  if (!food) return null;

  return (
    <div className={`card-overlay ${isVisible ? 'card-overlay--visible' : ''}`}>
      <div className={`card ${isVisible ? 'card--visible' : ''}`}>

        {/* 关闭按钮 */}
        <button className="card-close" onClick={onClose} aria-label="关闭">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* 标签 */}
        <div className="card-tags">
          {food.tags.map((tag) => (
            <span key={tag} className="card-tag">{tag}</span>
          ))}
        </div>

        {/* 食物名称 */}
        <h2 className="card-food">{food.food}</h2>

        {/* 作品与作者 */}
        <div className="card-book-row">
          <span className="card-book">{food.book}</span>
          <span className="card-author-sep">/</span>
          <span className="card-author">{food.author}</span>
        </div>

        {/* 地名 */}
        <div className="card-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          <span>{food.city}，{food.country}</span>
        </div>

        {/* 分隔线 */}
        <div className="card-divider"></div>

        {/* 名著原句 */}
        <blockquote className="card-excerpt">
          <span className="card-quote-mark">"</span>
          {food.excerpt}
        </blockquote>

        {/* 底部渐变遮罩 */}
        <div className="card-bottom-fade"></div>
      </div>
    </div>
  );
}

export default FoodCard;
