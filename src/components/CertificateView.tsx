import React, { useState } from 'react';
import { Spot, StampRecord } from '../types';
import { getExplorerTitle } from '../data/spotsData';
import { Award, Printer, X, Check, ShieldCheck, Edit3 } from 'lucide-react';

interface CertificateViewProps {
  collectedCount: number;
  totalCount: number;
  onClose: () => void;
}

export const CertificateView: React.FC<CertificateViewProps> = ({
  collectedCount,
  totalCount,
  onClose,
}) => {
  const [travelerName, setTravelerName] = useState('熱愛台灣的旅人');
  const [isEditing, setIsEditing] = useState(false);
  const currentTitle = getExplorerTitle(collectedCount);
  const percentage = Math.round((collectedCount / totalCount) * 100);
  const currentDate = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const serialNo = `TW-PASS-2026-${String(collectedCount * 137 + 1024).padStart(6, '0')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-amber-50 text-stone-900 rounded-2xl shadow-2xl border-4 border-amber-600/60 p-6 sm:p-10 flex flex-col z-10 max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* Close and Print Bar (Hidden on print) */}
        <div className="flex items-center justify-between gap-3 mb-6 print:hidden border-b border-amber-200/80 pb-3">
          <div className="flex items-center gap-2 text-xs text-amber-800">
            <Award className="w-4 h-4 text-amber-600" />
            <span className="font-semibold">官方觀光探索認證榮譽證書</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>列印 / 存為 PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Frame Area */}
        <div className="relative border-4 border-double border-amber-700/80 p-6 sm:p-10 rounded-xl bg-gradient-to-b from-[#fffbf0] via-[#fefaf0] to-[#fbf6e8] shadow-inner text-center">
          {/* Top Decorative Emblem */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full border-2 border-amber-700 p-1 flex items-center justify-center bg-amber-100/50 shadow-sm">
              <div className="w-full h-full rounded-full border border-amber-600 flex flex-col items-center justify-center">
                <span className="text-[10px] font-serif font-black text-amber-800">臺灣</span>
                <span className="text-[8px] font-mono text-amber-700">TAIWAN</span>
              </div>
            </div>
          </div>

          {/* Certificate Main Title */}
          <div className="text-xs uppercase tracking-widest text-amber-800 font-serif font-bold mb-1">
            REPUBLIC OF CHINA (TAIWAN) TOURISM BUREAU
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-widest text-amber-950 mb-2">
            臺灣觀光探索榮譽證書
          </h1>
          <p className="text-xs text-amber-800/80 font-serif italic mb-6">
            Certificate of Formosa Cultural Exploration &amp; Stamp Collector
          </p>

          {/* Traveler Recipient Name */}
          <div className="my-6">
            <p className="text-xs text-stone-600 mb-1 font-serif">特此頒發予行腳探索者：</p>
            <div className="inline-flex items-center justify-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={travelerName}
                    onChange={(e) => setTravelerName(e.target.value)}
                    className="text-xl sm:text-2xl font-serif font-bold text-stone-900 bg-white/80 border-b-2 border-amber-600 px-3 py-1 rounded text-center focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditing(true)}
                  className="group flex items-center gap-2 cursor-pointer border-b-2 border-dashed border-amber-700/60 pb-1 px-3 hover:border-amber-900"
                  title="點擊可修改證書姓名"
                >
                  <span className="text-xl sm:text-3xl font-serif font-black text-stone-900 tracking-wider">
                    {travelerName}
                  </span>
                  <Edit3 className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-800 print:hidden" />
                </div>
              )}
            </div>
          </div>

          {/* Commendation Prose */}
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-stone-700 leading-relaxed font-serif mb-8">
            閣下以熱忱腳步走訪台灣山林溪谷、海岸地質、人文古剎與夜市風情，親身體驗並於集章冊中成功收集{' '}
            <strong className="text-rose-700 font-mono text-base">{collectedCount}</strong> 處紀念印章
            （完成進度 <span className="text-rose-700 font-mono font-bold">{percentage}%</span>），
            特授予榮譽頭銜：
          </p>

          {/* Conferred Title Ribbon */}
          <div className="inline-block px-6 py-2.5 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-700 text-amber-50 rounded-lg shadow-md mb-8">
            <div className="text-lg sm:text-2xl font-serif font-black tracking-widest">
              【 {currentTitle.title} 】
            </div>
            <div className="text-[10px] text-amber-200 tracking-wider uppercase font-sans mt-0.5">
              {currentTitle.englishTitle}
            </div>
          </div>

          {/* Bottom Stamp Seal & Signatures */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 items-end pt-6 border-t border-amber-200/80 text-xs">
            {/* Left: Issue Date & Serial */}
            <div className="text-left space-y-1 text-stone-600">
              <div>
                認證日期：<span className="font-serif text-stone-800">{currentDate}</span>
              </div>
              <div className="text-[11px] font-mono text-stone-500">
                驗證字號：{serialNo}
              </div>
            </div>

            {/* Center: Official Red Seal Stamp */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-md border-2 border-rose-700 p-1 flex items-center justify-center bg-rose-50/40 transform rotate-2">
                <div className="w-full h-full border border-rose-600/80 flex flex-col items-center justify-center text-rose-800 p-0.5">
                  <div className="text-[9px] font-serif font-bold">臺灣觀光</div>
                  <div className="text-[10px] font-serif font-black tracking-widest my-0.5">
                    集章之印
                  </div>
                  <div className="text-[7px] font-mono text-rose-600">CERTIFIED</div>
                </div>
              </div>
              <span className="text-[10px] font-serif text-rose-800/80 mt-1">官方防偽印章</span>
            </div>

            {/* Right: Signature */}
            <div className="text-right space-y-1 text-stone-600 col-span-2 sm:col-span-1">
              <div className="font-serif font-bold text-stone-800">臺灣觀光守護委員會</div>
              <div className="text-[10px] text-stone-500">Formosa Tourism Council</div>
              <div className="w-24 h-[1px] bg-stone-400 ml-auto my-1" />
              <div className="text-[10px] italic text-stone-400">Authorized Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
