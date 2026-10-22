import React, { useState } from 'react';
import { Spot, StampRecord, RegionType, CategoryType } from '../types';
import { getExplorerTitle, EXPLORER_TITLES } from '../data/spotsData';
import {
  Award,
  Calendar,
  Compass,
  Filter,
  Flame,
  Lock,
  MapPin,
  Route,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

interface PassportViewProps {
  spots: Spot[];
  stampRecords: Record<string, StampRecord>;
  onSelectSpot: (spot: Spot) => void;
  onOpenCertificate: () => void;
  onOpenItinerary: () => void;
  onDemoCollect: () => void;
  onClearAllStamps: () => void;
  onClose: () => void;
}

export const PassportView: React.FC<PassportViewProps> = ({
  spots,
  stampRecords,
  onSelectSpot,
  onOpenCertificate,
  onOpenItinerary,
  onDemoCollect,
  onClearAllStamps,
  onClose,
}) => {
  const [filterRegion, setFilterRegion] = useState<RegionType | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Collected' | 'Uncollected'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const totalSpots = spots.length;
  const collectedCount = Object.keys(stampRecords).length;
  const percentage = Math.round((collectedCount / totalSpots) * 100);
  const currentTitle = getExplorerTitle(collectedCount);

  // Filter spots for grid
  const displayedSpots = spots.filter((spot) => {
    const isCollected = !!stampRecords[spot.id];
    if (filterRegion !== 'All' && spot.region !== filterRegion) return false;
    if (filterStatus === 'Collected' && !isCollected) return false;
    if (filterStatus === 'Uncollected' && isCollected) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = spot.name.toLowerCase().includes(q);
      const matchCounty = spot.county.toLowerCase().includes(q);
      const matchId = spot.id.toLowerCase().includes(q);
      return matchName || matchCounty || matchId;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[94vh] bg-stone-900 text-stone-100 rounded-2xl shadow-2xl border border-amber-900/40 flex flex-col overflow-hidden">
        {/* Passport Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-amber-800/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wide text-amber-100">
                觀光集章冊 · 護照總覽
              </h2>
              <div className="flex items-center gap-2 text-xs text-amber-300/80 mt-0.5">
                <span>探索榮譽頭銜：</span>
                <span className="font-bold text-amber-400">{currentTitle.title}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{collectedCount} / {totalSpots} ({percentage}%)</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenCertificate}
              className="px-3.5 py-1.5 text-xs font-semibold text-amber-950 bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 rounded-lg shadow-sm transition-all"
            >
              檢視成就證書
            </button>
            <button
              onClick={onOpenItinerary}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600/90 hover:bg-indigo-500 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Route className="w-3.5 h-3.5" />
              <span>智慧行程規劃</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress & Title Progression Strip */}
        <div className="px-6 py-3 bg-stone-950/70 border-b border-amber-900/20 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Progress bar */}
          <div className="flex-1 min-w-[240px]">
            <div className="flex justify-between text-[11px] text-stone-400 mb-1">
              <span>集章完成度</span>
              <span className="font-mono text-amber-400 font-bold">{percentage}%</span>
            </div>
            <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-rose-600 to-amber-400 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Titles Milestone Indicators */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-stone-400">
            {EXPLORER_TITLES.map((t, idx) => {
              const reached = collectedCount >= t.min;
              return (
                <div
                  key={idx}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    reached ? 'text-amber-300 font-semibold bg-amber-950/60 border border-amber-800/50' : 'text-stone-500'
                  }`}
                >
                  {t.title} ({t.min}+)
                </div>
              );
            })}
          </div>

          {/* Helper demo & reset buttons */}
          <div className="flex items-center gap-2 text-[11px]">
            <button
              onClick={onDemoCollect}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
              title="自動為 15 個熱門景點蓋章以供體驗"
            >
              快速體驗 (15景點)
            </button>
            <span className="text-stone-600">|</span>
            <button
              onClick={onClearAllStamps}
              className="text-stone-400 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>清空重置</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 bg-stone-900/90 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Region Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(['All', 'North', 'Central', 'South', 'East', 'Islands'] as const).map((reg) => {
              const label =
                reg === 'All'
                  ? '全部區域'
                  : reg === 'North'
                  ? '北部'
                  : reg === 'Central'
                  ? '中部'
                  : reg === 'South'
                  ? '南部'
                  : reg === 'East'
                  ? '東部'
                  : '離島';
              const active = filterRegion === reg;
              return (
                <button
                  key={reg}
                  onClick={() => setFilterRegion(reg)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-amber-600 text-white font-medium shadow-sm'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Status filter & Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-stone-800 border border-stone-700 text-stone-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="All">全部狀態</option>
              <option value="Collected">已收集 ({collectedCount})</option>
              <option value="Uncollected">未收集 ({totalSpots - collectedCount})</option>
            </select>

            <div className="relative flex-1 sm:w-44">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜尋景點或縣市..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 text-stone-100 pl-8 pr-3 py-1.5 rounded-lg text-xs placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* 100 Spots Stamp Passport Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-gradient-to-b from-stone-900 to-stone-950">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {displayedSpots.map((spot) => {
              const isCollected = !!stampRecords[spot.id];
              const record = stampRecords[spot.id];

              return (
                <div
                  key={spot.id}
                  onClick={() => onSelectSpot(spot)}
                  className={`group relative p-3 rounded-xl border cursor-pointer transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between min-h-[160px] ${
                    isCollected
                      ? 'bg-amber-950/30 border-rose-800/60 hover:border-rose-600 shadow-md'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-800/40'
                  }`}
                >
                  {/* Top metadata */}
                  <div className="flex items-center justify-between gap-1 text-[10px] text-stone-400">
                    <span className="font-mono text-amber-500/80">{spot.id}</span>
                    <span>{spot.county}</span>
                  </div>

                  {/* Stamp Graphic Center */}
                  <div className="my-2 flex items-center justify-center">
                    {isCollected ? (
                      /* Vermilion Traditional Stamp */
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-rose-500/80 p-1 flex items-center justify-center bg-rose-950/20 transform rotate-[-3deg] group-hover:rotate-0 transition-transform">
                        <div className="w-full h-full rounded-full border border-rose-500/70 flex flex-col items-center justify-center text-rose-400 text-center p-1">
                          <span className="text-[9px] font-serif font-black tracking-widest line-clamp-2 leading-tight">
                            {spot.name.slice(0, 4)}
                          </span>
                          <span className="text-[7px] text-rose-300 mt-0.5">紀念章</span>
                          <span className="text-[7px] font-mono text-rose-400/90 mt-0.5">
                            {record.stampedAt.slice(5, 10)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Uncollected Blank Seal Frame */
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-stone-700/60 flex flex-col items-center justify-center text-stone-600 group-hover:border-stone-500 group-hover:text-stone-400 transition-colors">
                        <Lock className="w-5 h-5 mb-1 opacity-70" />
                        <span className="text-[9px] font-serif">未蓋章</span>
                      </div>
                    )}
                  </div>

                  {/* Spot title bottom */}
                  <div className="text-center mt-1">
                    <div
                      className={`font-serif text-xs font-bold truncate ${
                        isCollected ? 'text-amber-200' : 'text-stone-300'
                      }`}
                    >
                      {spot.name}
                    </div>
                    <div className="text-[10px] text-stone-500 truncate">{spot.categoryZh}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {displayedSpots.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-stone-500 text-sm">
              <Compass className="w-8 h-8 mb-2 opacity-40" />
              <span>查無符合篩選條件的景點</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
