import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// 自定义地图标记图标
const createMarkerIcon = (isSelected, isHovered) => {
  const size = isSelected ? 32 : isHovered ? 28 : 22;
  const bgColor = isSelected ? '#8DA090' : isHovered ? '#A3B5A6' : '#A3B5A6';

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="10" r="8" fill="${bgColor}" opacity="0.15"/>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${bgColor}"/>
      <circle cx="12" cy="9" r="3" fill="#FDFBF7"/>
      <circle cx="12" cy="9" r="1.5" fill="#8DA090"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// 灰度地图瓦片
const MAP_TILES = {
  grayscale: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
};

function MapView({ data, onMarkerClick, selectedId }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // 初始化地图
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [30, 20],
      zoom: 2,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      worldCopyJump: true,
    });

    L.tileLayer(MAP_TILES.grayscale.url, {
      attribution: MAP_TILES.grayscale.attribution,
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 更新标记点
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !data.length) return;

    // 清除旧标记
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    // 添加新标记
    data.forEach((food) => {
      const icon = createMarkerIcon(food.id === selectedId, false);
      const marker = L.marker([food.lat, food.lng], { icon, riseOnHover: true })
        .addTo(map)
        .bindTooltip(food.food, {
          direction: 'top',
          offset: [0, -24],
          className: 'map-tooltip',
          opacity: 1,
        });

      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(food);
      });
      marker.on('mouseover', () => {
        if (food.id !== selectedId) {
          marker.setIcon(createMarkerIcon(false, true));
        }
      });
      marker.on('mouseout', () => {
        if (food.id !== selectedId) {
          marker.setIcon(createMarkerIcon(false, false));
        }
      });

      markersRef.current[food.id] = marker;
    });
  }, [data, selectedId, onMarkerClick]);

  // 选中时更新图标和视角
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.entries(markersRef.current).forEach(([id, marker]) => {
      marker.setIcon(createMarkerIcon(Number(id) === selectedId, false));
    });

    if (selectedId) {
      const food = data.find((f) => f.id === selectedId);
      if (food) {
        map.flyTo([food.lat, food.lng], Math.max(map.getZoom(), 4), {
          duration: 1.2,
          easeLinearity: 0.15,
        });
      }
    }
  }, [selectedId, data]);

  return <div ref={mapRef} className="map-container" />;
}

export default MapView;
