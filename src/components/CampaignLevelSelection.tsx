import React, { useState } from 'react';
import { CampaignLevel } from '../utils/levelData';
import { playSFX } from '../utils/audio';
import { Check, Trophy, Coins, ArrowLeft, Flame, Swords } from 'lucide-react';

interface CampaignLevelSelectionProps {
  levels: CampaignLevel[];
  unlockedLevel: number;
  completedLevels: number[];
  onSelectLevel: (level: CampaignLevel) => void;
  onBack: () => void;
}

export default function CampaignLevelSelection({
  levels,
  unlockedLevel,
  completedLevels,
  onSelectLevel,
  onBack
}: CampaignLevelSelectionProps) {
  void unlockedLevel;
  const [activeTab, setActiveTab] = useState<number>(0);

  const tabRanges = [
    { label: 'Sokak ARASI', min: 1, max: 15 },
    { label: 'Yeraltı Arenası', min: 16, max: 30 },
    { label: 'Neon Şehri', min: 31, max: 45 },
    { label: 'Şampiyonlar Kolezyumu', min: 46, max: 60 },
  ];

  const currentRange = tabRanges[activeTab];
  const filteredLevels = levels.filter(
    lvl => lvl.levelNumber >= currentRange.min && lvl.levelNumber <= currentRange.max
  );

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-5 select-none font-sans flex flex-col z-10 overflow-hidden">
      
      {/* Üst Panel & Navigasyon */}
      <div className="flex justify-between items-center mb-5 border-b border-zinc-900 pb-4 mt-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              playSFX('button_click');
              onBack();
            }}
            className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl border border-zinc-800/80 active:scale-95 transition-all duration-300 cursor-pointer shadow-md"
            title="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5 italic">
              <Trophy className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)] animate-pulse" />
              60 SEVİYE ŞAMPİYONLUK YOLU
            </h2>
            <p className="text-zinc-500 text-[11px] md:text-xs font-medium mt-0.5">
              Kariyer modunda zirveye tırman. İstediğin mücadeleyi seç ve ringe adım at.
            </p>
          </div>
        </div>

        {/* Mevcut Durum Rozeti */}
        <div className="hidden sm:flex bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-2xl items-center gap-2.5 backdrop-blur-sm shadow-lg">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">DURUM:</span>
          <span className="text-yellow-500 font-mono font-black text-xs drop-shadow-[0_0_6px_rgba(234,179,8,0.25)]">
            60 / 60 · TÜMÜ AÇIK
          </span>
        </div>
      </div>

      {/* SEKME SEÇİCİ (TABS) */}
      <div className="flex gap-2 mb-4 bg-zinc-950/60 p-1.5 rounded-2xl border border-zinc-900/80 backdrop-blur-sm">
        {tabRanges.map((tab, idx) => {
          const isActive = idx === activeTab;
          
          return (
            <button
              key={idx}
              onClick={() => {
                playSFX('button_click');
                setActiveTab(idx);
              }}
              className={`flex-1 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider italic transition-all duration-300 cursor-pointer border ${
                isActive
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 border-orange-500 text-white shadow-[0_4px_15px_rgba(239,68,68,0.25)] scale-[1.01]'
                  : 'bg-zinc-900/40 border-zinc-800/40 text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SEVİYE IZGARASI */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 max-w-[1500px] mx-auto pb-5">
          {filteredLevels.map((lvl) => {
            const isCompleted = completedLevels.includes(lvl.levelNumber);
            const isCurrent = lvl.levelNumber === unlockedLevel;

            // Dinamik Zorluk Renkleri
            let diffColor = 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20';
            if (lvl.difficultyName === 'Normal') diffColor = 'text-amber-400 border-amber-500/20 bg-amber-950/20';
            else if (lvl.difficultyName === 'Zor') diffColor = 'text-orange-400 border-orange-500/20 bg-orange-950/20';
            else if (lvl.difficultyName === 'Uzman') diffColor = 'text-rose-500 border-rose-500/20 bg-rose-950/20';

            return (
              <div
                key={lvl.levelNumber}
                className={`group rounded-2xl p-3 border flex flex-col justify-between relative overflow-hidden transition-all duration-500 min-h-[118px] ${
                  isCurrent
                    ? 'bg-zinc-900/80 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.25)] ring-1 ring-orange-500/30'
                    : 'bg-zinc-900/30 border-zinc-800/80 backdrop-blur-md shadow-xl hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)]'
                }`}
              >
                {/* ================= KUTU ARKASI DEKORASYONLARI ================= */}
                {/* 1. Dev Şeffaf Arka Plan Seviye Numarası */}
                <span className="absolute right-[-10px] bottom-10 text-6xl font-black font-mono italic text-zinc-800/10 select-none tracking-tighter pointer-events-none group-hover:text-orange-500/10 group-hover:scale-110 transition-all duration-500">
                  #{lvl.levelNumber}
                </span>

                {/* 2. Kafes Örgü/Çizgili Dövüş Arenası Deseni */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.15)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.15)_75%,transparent_75%,transparent)] bg-[length:8px_8px] opacity-30 pointer-events-none" />

                {/* 3. Köşeden Sızan Hafif Neon Işık Süzmesi */}
                <div className={`absolute -left-16 -top-16 w-32 h-32 rounded-full blur-2xl opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-25 ${
                  lvl.isBoss ? 'bg-purple-500' : isCurrent ? 'bg-orange-500' : 'bg-zinc-400'
                }`} />

                {/* 4. Hover Yapınca Üstten İnene İnce Beyaz Parlama Çizgisi */}
                <div className="absolute -inset-px bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
                {/* ============================================================= */}

                {/* Üst Rozet Bölümü */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  {lvl.isBoss ? (
                    <span className="flex items-center gap-1 text-[7px] font-black px-1.5 py-0.5 rounded-full border border-purple-500/40 bg-purple-950/40 text-purple-400 uppercase tracking-widest shadow-[0_0_10px_rgba(168,85,247,0.2)] animate-pulse">
                      <Flame className="w-2.5 h-2.5" />
                      PATRON
                    </span>
                  ) : (
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wider backdrop-blur-md ${diffColor}`}>
                      {lvl.difficultyName}
                    </span>
                  )}
                </div>

                {/* Detaylar */}
                <div className="relative z-10">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-600 font-mono font-black text-[9px] tracking-wider">S #{lvl.levelNumber}</span>
                    {isCompleted && (
                      <span className="bg-emerald-500/10 border border-emerald-500/30 p-0.5 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.2)]">
                        <Check className="w-2 h-2 text-emerald-400" />
                      </span>
                    )}
                    {isCurrent && (
                      <span className="bg-orange-500/10 border border-orange-500/30 px-1 py-0.5 rounded-md text-[7px] font-black text-orange-400 uppercase tracking-widest animate-pulse">
                        AKTİF
                      </span>
                    )}
                  </div>

                  <h3 className="text-white font-black italic text-[12px] uppercase tracking-tight mt-1 truncate max-w-[105px]">
                    {lvl.enemyName}
                  </h3>

                  {/* Avatar ve Ödül Alanı */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-7 h-7 rounded-full bg-white/5 blur-md group-hover:bg-orange-500/10 transition-all duration-500" />
                      <span className="text-2xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                        {lvl.avatar}
                      </span>
                    </div>
                    
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-1 text-[8px] font-bold text-yellow-500 leading-none mb-1">
                        <Coins className="w-2.5 h-2.5 drop-shadow-[0_0_4px_rgba(234,179,8,0.3)]" />
                        <span className="font-mono font-black">{lvl.rewardCoins}</span>
                      </div>
                      <span className="text-[8px] text-zinc-500 font-mono font-bold uppercase tracking-wide">
                        HP: <span className="text-zinc-300">{lvl.enemyHealth}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buton Alanı */}
                <div className="mt-2 relative z-10">
                  <button
                    onClick={() => {
                      playSFX('button_click');
                      onSelectLevel(lvl);
                    }}
                    className={`w-full py-1.5 active:scale-95 text-white font-black text-[9px] uppercase tracking-wider italic rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md cursor-pointer border-b-4 active:border-b-0 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border-red-950 shadow-[0_4px_10px_rgba(239,68,68,0.2)]'
                        : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-950'
                    }`}
                  >
                    <Swords className="w-2.5 h-2.5" />
                    DÖVÜŞE BAŞLA
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}