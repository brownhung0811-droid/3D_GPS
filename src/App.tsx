/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TaiwanMap3D } from './components/TaiwanMap3D';
import { StampModal } from './components/StampModal';
import { PassportView } from './components/PassportView';
import { CertificateView } from './components/CertificateView';
import { ItineraryModal } from './components/ItineraryModal';
import { ALL_100_SPOTS, getExplorerTitle } from './data/spotsData';
import { Spot, StampRecord, RegionType, CategoryType, LightMode, ViewMode } from './types';
import {
  Award,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Compass,
  Layers,
  MapPin,
  Moon,
  Printer,
  RotateCcw,
  Route,
  Sun,
  Sunset,
  Volume2,
} from 'lucide-react';

const STORAGE_KEY = 'taiwan_travel_stamps_v1';

export default function App() {
  const [spots] = useState<Spot[]>(ALL_100_SPOTS);
  const [stampRecords, setStampRecords] = useState<Record<string, StampRecord>>({});
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  // View Modals
  const [showPassport, setShowPassport] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);

  // Filters & Modes
  const [selectedRegion, setSelectedRegion] = useState<RegionType | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [lightMode, setLightMode] = useState<LightMode>('day');
  const [viewMode, setViewMode] = useState<ViewMode>('3D');

  // Bottom dock collapse state
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setStampRecords(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load stamps from localStorage:', e);
    }
  }, []);

  // Save to LocalStorage
  const updateStampRecords = (updater: (prev: Record<string, StampRecord>) => Record<string, StampRecord>) => {
    setStampRecords((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save stamps to localStorage:', e);
      }
      return next;
    });
  };

  const handleStamp = (spotId: string) => {
    updateStampRecords((prev) => ({
      ...prev,
      [spotId]: {
        spotId,
        stampedAt: new Date().toISOString(),
      },
    }));
  };

  const handleResetStamp = (spotId: string) => {
    updateStampRecords((prev) => {
      const next = { ...prev };
      delete next[spotId];
      return next;
    });
  };

  const handleClearAllStamps = () => {
    if (window.confirm('確定要清空所有已收集的紀念印章嗎？此動作將重置集章冊進度。')) {
      updateStampRecords(() => ({}));
    }
  };

  // Demo helper: collect 15 representative spots
  const handleDemoCollect = () => {
    const demoIds = [
      'TW-NORTH-01', 'TW-NORTH-02', 'TW-NORTH-03', 'TW-NORTH-04',
      'TW-CENTRAL-01', 'TW-CENTRAL-02', 'TW-CENTRAL-03', 'TW-CENTRAL-04',
      'TW-SOUTH-01', 'TW-SOUTH-02', 'TW-SOUTH-03', 'TW-SOUTH-06',
      'TW-EAST-01', 'TW-EAST-04', 'TW-ISL-01'
    ];
    updateStampRecords((prev) => {
      const next = { ...prev };
      const now = new Date().toISOString();
      demoIds.forEach((id) => {
        next[id] = { spotId: id, stampedAt: now };
      });
      return next;
    });
  };

  const collectedSpotIds = useMemo(() => new Set(Object.keys(stampRecords)), [stampRecords]);
  const collectedCount = collectedSpotIds.size;
  const currentTitle = getExplorerTitle(collectedCount);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans flex flex-col">
      {/* 1. Universal Top Navigation Bar */}
      <header className="relative z-30 h-14 bg-slate-900/95 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 backdrop-blur-md shrink-0">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-black text-sm sm:text-base text-amber-100 tracking-wide">
              台灣 3D 旅遊導覽與觀光集章冊
            </span>
            <span className="hidden lg:inline text-[10px] text-amber-300/60 ml-2 font-mono">
              Taiwan 3D Stamp Passport
            </span>
          </div>
        </div>

        {/* Navigation Action Links */}
        <nav className="flex items-center gap-3 sm:gap-5 text-xs text-slate-300 font-medium">
          <button
            onClick={() => setShowPassport(true)}
            className="flex items-center gap-1.5 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-slate-800"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="whitespace-nowrap">集章冊</span>
            <span className="bg-rose-950 text-rose-300 border border-rose-800/60 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {collectedCount}/100
            </span>
          </button>

          <button
            onClick={() => setShowItinerary(true)}
            className="flex items-center gap-1.5 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-slate-800"
          >
            <Route className="w-4 h-4 text-indigo-400" />
            <span className="whitespace-nowrap">行程規劃</span>
          </button>

          <button
            onClick={() => setShowCertificate(true)}
            className="flex items-center gap-1.5 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-slate-800"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span className="whitespace-nowrap hidden sm:inline">成就證書</span>
          </button>
        </nav>

        {/* Atmosphere & Lighting Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 shrink-0">
          <button
            onClick={() => setLightMode('day')}
            title="日間清朗（明亮日光）"
            className={`p-1.5 rounded-lg transition-colors ${
              lightMode === 'day' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLightMode('sunset')}
            title="金黃夕陽（暮色霞光）"
            className={`p-1.5 rounded-lg transition-colors ${
              lightMode === 'sunset' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sunset className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLightMode('night')}
            title="璀璨夜景（夜市與燈火）"
            className={`p-1.5 rounded-lg transition-colors ${
              lightMode === 'night' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Secondary Filter Bar (Region & Categories) */}
      <div className="relative z-20 bg-slate-900/80 border-b border-slate-800/60 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-sm shrink-0">
        {/* Regions */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline whitespace-nowrap">分區：</span>
          {(['All', 'North', 'Central', 'South', 'East', 'Islands'] as const).map((r) => {
            const label =
              r === 'All' ? '全部' : r === 'North' ? '北部' : r === 'Central' ? '中部' : r === 'South' ? '南部' : r === 'East' ? '東部' : '離島';
            const active = selectedRegion === r;
            return (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  active ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline whitespace-nowrap">分類：</span>
          {(['All', 'Nature', 'Coast', 'Culture', 'Landmark', 'Food'] as const).map((c) => {
            const label =
              c === 'All'
                ? '全類別'
                : c === 'Nature'
                ? '山林景觀'
                : c === 'Coast'
                ? '海岸海島'
                : c === 'Culture'
                ? '人文古蹟'
                : c === 'Landmark'
                ? '休閒樂園'
                : '夜市美食';
            const active = selectedCategory === c;
            return (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  active ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main 3D Interactive Viewport */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <TaiwanMap3D
          spots={spots}
          collectedSpotIds={collectedSpotIds}
          onSelectSpot={(spot) => setSelectedSpot(spot)}
          selectedSpotId={selectedSpot?.id}
          selectedRegion={selectedRegion}
          selectedCategory={selectedCategory}
          lightMode={lightMode}
          onLightModeChange={setLightMode}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* 4. Sleek Collapsible Bottom Dock (Three.js Directive Compliant) */}
        <div
          className={`absolute left-1/2 transform -translate-x-1/2 z-20 transition-all duration-300 max-w-[94vw] w-auto ${
            isDockCollapsed ? 'bottom-2' : 'bottom-5'
          }`}
        >
          {/* Collapse Toggle Tab attached to top of dock */}
          <div className="flex justify-center -mb-2">
            <button
              onClick={() => setIsDockCollapsed(!isDockCollapsed)}
              className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1 rounded-t-lg border-t border-x border-slate-700/70 text-[10px] flex items-center gap-1 shadow-md backdrop-blur-sm"
            >
              {isDockCollapsed ? (
                <>
                  <ChevronUp className="w-3 h-3 text-amber-400" />
                  <span>展開控制列</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 text-amber-400" />
                  <span>收合控制列</span>
                </>
              )}
            </button>
          </div>

          {/* Main Bottom Dock Panel */}
          {!isDockCollapsed && (
            <div className="bg-slate-900/90 text-white px-4 sm:px-6 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center gap-4 sm:gap-6 text-xs">
              {/* Explorer Title Badge */}
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-serif font-black text-sm">
                  {currentTitle.title}
                </span>
                <span className="text-slate-400 text-[11px] font-mono">
                  ({collectedCount}/100 章)
                </span>
              </div>

              <div className="w-[1px] h-4 bg-slate-700 hidden sm:block" />

              {/* View mode toggle */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 hidden sm:inline">視角模式：</span>
                <button
                  onClick={() => setViewMode(viewMode === '3D' ? '2D' : '3D')}
                  className="px-2.5 py-1 rounded-lg font-bold text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 transition-colors"
                >
                  {viewMode === '3D' ? '3D 透視視角' : '2D 俯視地圖'}
                </button>
              </div>

              <div className="w-[1px] h-4 bg-slate-700 hidden sm:block" />

              {/* Quick Passport Trigger */}
              <button
                onClick={() => setShowPassport(true)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-semibold shadow-sm transition-all"
              >
                翻閱集章冊
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 5. Modals */}
      {selectedSpot && (
        <StampModal
          spot={selectedSpot}
          stampRecord={stampRecords[selectedSpot.id]}
          onStamp={handleStamp}
          onResetStamp={handleResetStamp}
          onClose={() => setSelectedSpot(null)}
        />
      )}

      {showPassport && (
        <PassportView
          spots={spots}
          stampRecords={stampRecords}
          onSelectSpot={(spot) => {
            setShowPassport(false);
            setSelectedSpot(spot);
          }}
          onOpenCertificate={() => {
            setShowPassport(false);
            setShowCertificate(true);
          }}
          onOpenItinerary={() => {
            setShowPassport(false);
            setShowItinerary(true);
          }}
          onDemoCollect={handleDemoCollect}
          onClearAllStamps={handleClearAllStamps}
          onClose={() => setShowPassport(false)}
        />
      )}

      {showCertificate && (
        <CertificateView
          collectedCount={collectedCount}
          totalCount={spots.length}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {showItinerary && (
        <ItineraryModal
          spots={spots}
          stampRecords={stampRecords}
          onSelectSpot={(spot) => {
            setShowItinerary(false);
            setSelectedSpot(spot);
          }}
          onClose={() => setShowItinerary(false)}
        />
      )}
    </div>
  );
}
