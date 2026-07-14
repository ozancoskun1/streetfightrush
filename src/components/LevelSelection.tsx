import React from 'react';
import { Opponent } from '../types';
import { playSFX } from '../utils/audio';
import { Swords, Check, Trophy, ArrowLeft, Heart, Zap, ShieldAlert } from 'lucide-react';

interface LevelSelectionProps {
  opponents: Opponent[];
  unlockedId: number;
  onSelectOpponent: (opponent: Opponent) => void;
  matchesWon: number;
  onBack: () => void;
}

export default function LevelSelection({
  opponents,
  unlockedId,
  onSelectOpponent,
  matchesWon,
  onBack
}: LevelSelectionProps) {
  // Tüm rakipler daima açık. Prop eski kodlarla uyumluluk için tutuluyor.
  void unlockedId;

  const getDifficultyLabel = (id: number) => {
    if (id <= 3) return { text: 'KOLAY', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' };
    if (id <= 7) return { text: 'ORTA', color: 'text-amber-400 border-amber-500/30 bg-amber-950/20' };
    if (id <= 11) return { text: 'ZOR', color: 'text-rose-500 border-rose-500/30 bg-rose-950/20' };
    return { text: 'ŞAMPİYON', color: 'text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-950/30 border-2' };
  };

  return (
    <div className="absolute inset-0 w-full max-w-full bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-4 sm:p-5 select-none font-sans overflow-y-auto overflow-x-hidden overscroll-x-none touch-pan-y">
      {/* Dev Arka Plan Başlığı */}
      <h1 className="absolute top-8 left-0 right-0 w-full max-w-full overflow-hidden text-center text-7xl md:text-[12rem] font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-800/10 to-transparent select-none uppercase whitespace-nowrap z-0 pointer-events-none">
        SOKAK RİNGLERİ
      </h1>

      {/* Geri Butonu */}
      <button
        onClick={() => {
          playSFX('button_click');
          onBack();
        }}
        className="fixed left-[max(1.25rem,env(safe-area-inset-left))] top-[max(1.25rem,env(safe-area-inset-top))] z-50 inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-black/80 backdrop-blur-md w-11 h-11 text-zinc-300 hover:text-white hover:border-orange-500/50 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all duration-300 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4 text-orange-500" />
      </button>

      {/* Üst Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 border-b border-zinc-900 pb-4 z-10 relative pl-16 md:pl-20 mt-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2 italic">
            <Trophy className="w-5 h-5 text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
            SOKAK RİNGLERİ
          </h2>
          <p className="text-zinc-500 text-[11px] mt-1 font-medium">
            Kavga sokakta başlar. Rakiplerini yen ve şampiyon ol.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-2xl flex items-center gap-2.5 backdrop-blur-sm shadow-lg">
          <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">KAZANILAN MAÇ:</span>
          <span className="text-orange-500 font-mono font-black text-sm drop-shadow-[0_0_6px_rgba(249,115,22,0.3)]">
            {matchesWon}
          </span>
        </div>
      </div>

      {/* Kompakt Kartlar Izgarası */}
      <div className="grid w-full min-w-0 max-w-[1500px] grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 mx-auto pb-6 z-10 relative">
        {opponents.map((opp, index) => {
          const isBeaten = index < Math.min(matchesWon, opponents.length);
          const diff = getDifficultyLabel(opp.id);

          return (
            <div
              key={opp.id}
              className="group min-w-0 rounded-2xl p-3 border flex flex-col justify-between relative overflow-hidden transition-all duration-500 min-h-[188px] bg-zinc-900/30 border-zinc-800/80 backdrop-blur-md hover:border-orange-500/40 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.55),_0_0_16px_rgba(249,115,22,0.08)]"
            >
              {/* Parlama Efekti */}
              <div className="absolute -inset-px bg-gradient-to-b from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

              {/* Zorluk Etiketi */}
              <div className="absolute top-2.5 right-2.5 z-10">
                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wider backdrop-blur-md ${diff.color}`}>
                  {diff.text}
                </span>
              </div>

              <div className="relative z-10">
                <span className="text-zinc-600 font-black text-[9px] block font-mono tracking-widest uppercase">
                  MAÇ #{opp.id}
                </span>

                <h3 className="min-w-0 text-white font-black italic text-[12px] uppercase tracking-tight mt-1 flex items-center gap-1 truncate pr-8">
                  <span className="min-w-0 truncate">{opp.name}</span>
                  {isBeaten && (
                    <span className="shrink-0 bg-emerald-500/10 border border-emerald-500/30 p-0.5 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.2)]">
                      <Check className="w-2 h-2 text-emerald-400" />
                    </span>
                  )}
                </h3>

                {/* Karakter Avatar Alanı */}
                <div className="h-12 flex items-center justify-center my-2 relative">
                  <div className="absolute w-9 h-9 rounded-full bg-orange-500/5 blur-lg group-hover:bg-orange-500/10 transition-all duration-500" />
                  <span className="text-3xl filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.75)] transform group-hover:scale-110 transition-transform duration-500">
                    {opp.avatar}
                  </span>
                </div>

                {/* Kompakt İstatistikler */}
                <div className="grid grid-cols-3 gap-1 bg-black/40 p-1.5 rounded-xl border border-zinc-800/40 text-center text-zinc-400 font-semibold mb-2 shadow-inner">
                  <div className="flex flex-col items-center">
                    <Heart className="w-2.5 h-2.5 text-rose-500 mb-0.5 opacity-70" />
                    <span className="text-zinc-500 text-[7px] font-black uppercase">CAN</span>
                    <span className="text-zinc-100 font-mono font-black text-[9px]">{opp.health}</span>
                  </div>

                  <div className="flex flex-col items-center border-x border-zinc-800/60">
                    <Zap className="w-2.5 h-2.5 text-amber-500 mb-0.5 opacity-70" />
                    <span className="text-zinc-500 text-[7px] font-black uppercase">GÜÇ</span>
                    <span className="text-zinc-100 font-mono font-black text-[9px]">{opp.damage}</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <ShieldAlert className="w-2.5 h-2.5 text-blue-500 mb-0.5 opacity-70" />
                    <span className="text-zinc-500 text-[7px] font-black uppercase">HIZ</span>
                    <span className="text-zinc-100 font-mono font-black text-[9px]">{opp.speed}</span>
                  </div>
                </div>
              </div>

              {/* Meydan Oku Butonu */}
              <button
                onClick={() => {
                  playSFX('button_click');
                  onSelectOpponent(opp);
                }}
                className="w-full min-w-0 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-95 text-white border-b-4 border-orange-950 active:border-b-0 font-black text-[9px] uppercase tracking-wider italic rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_10px_rgba(249,115,22,0.18)] hover:shadow-[0_5px_15px_rgba(249,115,22,0.3)] cursor-pointer relative z-10"
              >
                <Swords className="w-2.5 h-2.5" />
                MEYDAN OKU
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
