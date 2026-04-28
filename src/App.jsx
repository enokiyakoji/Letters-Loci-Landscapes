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
  const [pickedCoords, setPickedCoords] = useState(null);
  const [allFoods, setAllFoods] = useState(builtinData);

  useEffect(() => {
    fetchFoods()
      .then((data) => setAllFoods(data))
      .catch(() => setAllFoods(builtinData));
  }, []);

  const handleMarkerClick = useCallback((food) => {
    setSelectedFood(food);
    setIsCardVisible(true);
  }, []);

  const handleCloseCard = useCallback(() => {
    setIsCardVisible(false);
    setTimeout(() => setSelectedFood(null), 350);
  }, []);

  const handleMapClick = useCallback((coords) => {
    setPickedCoords(coords);
    setShowSubmitForm(true);
  }, []);

  const handleOpenSubmitForm = useCallback(() => {
    setPickedCoords(null);
    setShowSubmitForm(true);
  }, []);

  const handleCloseSubmitForm = useCallback(() => {
    setShowSubmitForm(false);
    setPickedCoords(null);
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
              onMapClick={handleMapClick}
              isCoordPicking={showSubmitForm}
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

            {/* 管理入口 */}
            <button
              className="admin-entry"
              onClick={() => setView('admin')}
              aria-label="管理"
            >
              管理
            </button>

            {/* 底部信息 */}
            <div className="app-footer-info">
              <span>{allFoods.length} 个美食标记</span>
            </div>
          </>
        )}

        {view === 'admin' && (
          <AdminPanel onBack={() => setView('map')} />
        )}
      </main>

      {/* 美食卡片 */}
      <FoodCard
        food={selectedFood}
        isVisible={isCardVisible}
        onClose={handleCloseCard}
      />

      {/* 投稿表单 */}
      <SubmitForm
        isOpen={showSubmitForm}
        onClose={handleCloseSubmitForm}
        pickedCoords={pickedCoords}
      />
    </div>
  );
}

export default App;
