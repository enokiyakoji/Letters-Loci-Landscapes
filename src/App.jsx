import { useState, useEffect, useCallback } from 'react';
import MapView from './components/MapView';
import FoodCard from './components/FoodCard';
import SubmitForm from './components/SubmitForm';
import AdminPanel from './components/AdminPanel';
import { fetchFoods } from './api';
import builtinData from './data/literaryFoods.json';
import './App.css';

function App() {
  const [view, setView] = useState('map'); // 'map' | 'admin'
  const [selectedFood, setSelectedFood] = useState(null);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [allFoods, setAllFoods] = useState(builtinData);
  const [hasBackend, setHasBackend] = useState(false);

  useEffect(() => {
    fetchFoods()
      .then((data) => {
        setAllFoods(data);
        setHasBackend(true);
      })
      .catch(() => setAllFoods(builtinData));
  }, []);

  const handleMarkerClick = useCallback((food) => {
    if (showSubmitForm) return;
    setSelectedFood(food);
    setIsCardVisible(true);
  }, [showSubmitForm]);

  const handleCloseCard = useCallback(() => {
    setIsCardVisible(false);
    setTimeout(() => setSelectedFood(null), 350);
  }, []);

  const handleOpenSubmitForm = useCallback(() => {
    if (isCardVisible) handleCloseCard();
    setShowSubmitForm(true);
  }, [isCardVisible, handleCloseCard]);

  const handleCloseSubmitForm = useCallback(() => {
    setShowSubmitForm(false);
  }, []);

  return (
    <div className="app">
      {/* 顶栏 */}
      <header className="app-header">
        <h1 className="app-title">文学美食地图</h1>
        <p className="app-subtitle">Literary Cuisines Map</p>
        <span className="app-header-line" />
      </header>

      {/* 地图区域 */}
      <main className="app-main">
        {view === 'map' && (
          <>
            <MapView
              data={allFoods}
              onMarkerClick={handleMarkerClick}
              selectedId={selectedFood?.id}
            />

            {/* 浮动投稿按钮 */}
            <button
              className="fab"
              onClick={handleOpenSubmitForm}
              aria-label="投稿"
              title="贡献美食记忆"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            {/* 管理入口（仅后端可用时） */}
            {hasBackend && (
              <button
                className="admin-entry"
                onClick={() => setView('admin')}
                aria-label="管理"
              >
                管理
              </button>
            )}

            {/* 底部信息 */}
            <div className="app-footer-info">
              <span>{allFoods.length} 个美食标记</span>
            </div>
          </>
        )}

        {hasBackend && view === 'admin' && (
          <AdminPanel onBack={() => setView('map')} />
        )}
      </main>

      {/* 美食卡片 */}
      <FoodCard
        food={selectedFood}
        isVisible={isCardVisible}
        onClose={handleCloseCard}
      />

      {/* 投稿面板 */}
      <SubmitForm
        isOpen={showSubmitForm}
        onClose={handleCloseSubmitForm}
      />
    </div>
  );
}

export default App;
