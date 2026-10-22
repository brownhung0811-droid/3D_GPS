import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Spot, StampRecord } from '../types';
import { playStampSound } from '../utils/audio';
import {
  X,
  MapPin,
  Mountain,
  Calendar,
  Sparkles,
  RotateCcw,
  Bot,
  Utensils,
  BookOpen,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface StampModalProps {
  spot: Spot | null;
  onClose: () => void;
  stampRecord?: StampRecord;
  onStamp: (spotId: string) => void;
  onResetStamp: (spotId: string) => void;
}

export const StampModal: React.FC<StampModalProps> = ({
  spot,
  onClose,
  stampRecord,
  onStamp,
  onResetStamp,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeAiTab, setActiveAiTab] = useState<'tips' | 'photo' | 'crowd'>('tips');
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!spot) return null;

  const isStamped = !!stampRecord;

  const handleTriggerStamp = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    playStampSound();

    // Trigger confetti explosion from bottom center
    setTimeout(() => {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#dc2626', '#b91c1c', '#f59e0b', '#fbbf24', '#059669'],
      });
      onStamp(spot.id);
      setIsAnimating(false);
    }, 450);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`我在「台灣 3D 旅遊導覽與觀光集章冊」探索了【${spot.name}】！`);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-amber-50/95 text-slate-800 rounded-2xl shadow-2xl border border-amber-200/60 overflow-hidden z-10 max-h-[92vh] flex flex-col">
        {/* Header Visual Bar with category banner */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-r from-amber-900 via-stone-800 to-amber-950 text-amber-50 border-b border-amber-900/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-amber-200/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs text-amber-300/90 mb-1">
            <span className="font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/30">
              {spot.id}
            </span>
            <span aria-hidden="true">·</span>
            <span>{spot.regionZh}</span>
            <span aria-hidden="true">·</span>
            <span>{spot.county}</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-200">{spot.categoryZh}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white">
            {spot.name}
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/70 font-sans mt-0.5">{spot.englishName}</p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-amber-100/80">
            <div className="flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-amber-400" />
              <span>海拔 {spot.elevation}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{spot.bestSeason}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-300 font-mono">
              <span>★</span>
              <span className="font-bold">{spot.rating}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          {/* 1. Immersive Stamp Interaction Panel */}
          <div className="bg-white rounded-xl p-5 border border-amber-200/80 shadow-sm flex flex-col items-center justify-center text-center">
            {isStamped ? (
              <div className="w-full flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 text-xs text-rose-800 font-bold mb-3 tracking-wider bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  <CheckCircle2 className="w-4 h-4 text-rose-600" />
                  <span>【 已收集此紀念章 】</span>
                </div>

                {/* Traditional Vermilion Seal Stamp Graphic */}
                <div className="relative group p-4">
                  <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-full border-4 border-dashed border-rose-700 p-2 flex items-center justify-center bg-rose-50/50 shadow-inner transform rotate-[-2deg] transition-transform duration-300 group-hover:rotate-0">
                    <div className="w-full h-full rounded-full border-2 border-rose-700/80 p-2 flex flex-col items-center justify-center text-rose-800">
                      <div className="text-[10px] tracking-widest font-serif font-bold text-rose-700 uppercase">
                        TAIWAN STAMP
                      </div>
                      <div className="w-8 h-[1px] bg-rose-600 my-1" />
                      <div className="text-base sm:text-lg font-serif font-black tracking-widest text-rose-800 text-center leading-snug px-2">
                        {spot.name.slice(0, 6)}
                      </div>
                      <div className="text-[11px] font-serif text-rose-700 mt-0.5">觀光紀念章</div>
                      <div className="w-8 h-[1px] bg-rose-600 my-1" />
                      <div className="text-[9px] font-mono text-rose-600">{spot.id}</div>
                      <div className="text-[9px] font-mono text-rose-500 mt-0.5">
                        {stampRecord?.stampedAt.slice(0, 10)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => onResetStamp(spot.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>清除重置</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-amber-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedNotification ? '已複製分享文字！' : '分享此景點'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center py-2">
                <p className="text-xs text-slate-600 mb-3">
                  立足福爾摩沙名勝，立即在您的專屬集章冊中蓋上紀念印泥！
                </p>

                {/* Tactile Stamp Button */}
                <button
                  onClick={handleTriggerStamp}
                  disabled={isAnimating}
                  className={`group relative overflow-hidden px-8 py-3.5 rounded-xl font-serif font-black text-white text-base sm:text-lg tracking-wider shadow-lg transition-all duration-200 active:scale-95 ${
                    isAnimating
                      ? 'bg-rose-900 scale-95 ring-4 ring-rose-400'
                      : 'bg-gradient-to-b from-rose-600 via-rose-700 to-rose-800 hover:from-rose-500 hover:to-rose-700 shadow-rose-900/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-300 animate-spin duration-3000" />
                    <span>立即蓋上紀念章</span>
                  </div>
                  {/* Subtle woodgrain sheen */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
                </button>
                <span className="text-[11px] text-slate-600 mt-2">
                  點擊將觸發沉穩木槌敲章音效與朱紅印泥特效
                </span>
              </div>
            )}
          </div>

          {/* 2. Highlights Tags */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900/80 mb-2">
              必訪特色亮點
            </h3>
            <div className="flex flex-wrap gap-2">
              {spot.highlights.map((hl, i) => (
                <div
                  key={i}
                  className="text-xs text-stone-700 bg-amber-100/70 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Description & History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 p-4 rounded-xl border border-amber-200/60">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-1.5">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <span>景點簡介</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{spot.description}</p>
            </div>

            <div className="bg-white/80 p-4 rounded-xl border border-amber-200/60">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-1.5">
                <Utensils className="w-4 h-4 text-amber-700" />
                <span>在地內行推薦美食</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{spot.localFood}</p>
              <div className="mt-2 text-[11px] text-stone-500 font-serif italic">
                歷史淵源：{spot.history}
              </div>
            </div>
          </div>

          {/* 4. Gemini AI Local Guide Card (UI Demo - Unwired Backend) */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-stone-900 text-white rounded-xl p-4 border border-indigo-800/40 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-sm text-indigo-200">Gemini AI 在地導遊</span>
              </div>
              <span className="text-[10px] text-indigo-300/60 border border-indigo-500/30 px-2 py-0.5 rounded">
                介面展示，未接 API
              </span>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1.5 mb-3 bg-slate-800/80 p-1 rounded-lg text-xs">
              <button
                onClick={() => setActiveAiTab('tips')}
                className={`flex-1 py-1 px-2 rounded-md transition-colors ${
                  activeAiTab === 'tips' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                私房筆記
              </button>
              <button
                onClick={() => setActiveAiTab('photo')}
                className={`flex-1 py-1 px-2 rounded-md transition-colors ${
                  activeAiTab === 'photo' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                私房攝影位
              </button>
              <button
                onClick={() => setActiveAiTab('crowd')}
                className={`flex-1 py-1 px-2 rounded-md transition-colors ${
                  activeAiTab === 'crowd' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                避開人潮
              </button>
            </div>

            {/* AI advice text */}
            <div className="text-xs text-indigo-100/90 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
              {activeAiTab === 'tips' && spot.aiTips.localSecret}
              {activeAiTab === 'photo' && spot.aiTips.photoSpot}
              {activeAiTab === 'crowd' && spot.aiTips.crowdAvoidance}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
