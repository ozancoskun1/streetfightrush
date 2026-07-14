import React from 'react';
import { Coins, Volume2, VolumeX, Smartphone, Settings } from 'lucide-react';
import { playSFX } from '../utils/audio';

interface MainHeaderProps {
  coins: number;
  onAddCoins: () => void;
  soundOn: boolean;
  vibrationOn: boolean;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onOpenSettings: () => void;
  currentScreen: string;
  onBack: () => void;
}

export default function MainHeader({
  coins,
  onAddCoins,
  soundOn,
  vibrationOn,
  onToggleSound,
  onToggleVibration,
  onOpenSettings,
  currentScreen,
  onBack
}: MainHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/90 to-[#121212]/95 border-b border-zinc-800 px-4 flex items-center justify-between z-30 font-sans select-none shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      {/* Title & Back Button */}
      <div className="flex items-center gap-3">
        {currentScreen !== 'menu' && (
          <button
            onClick={() => {
              playSFX('button_click');
              onBack();
            }}
            className="px-3.5 py-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-black text-xs rounded-xl border-b-4 border-zinc-950 active:border-b-0 uppercase tracking-wider transition-all"
          >
            ← GERİ
          </button>
        )}
        <div className="flex flex-col">
          <span className="text-orange-500 font-black italic text-base md:text-lg uppercase tracking-tighter leading-none">
            STREET FIGHTER RUSH
          </span>
          <span className="text-white font-extrabold italic text-[10px] uppercase tracking-[0.2em] leading-none mt-0.5 opacity-90">
            RUSH
          </span>
        </div>
      </div>

      {/* Coins & Settings Panel */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Coins indicator */}
        <div className="bg-black/55 px-3.5 py-1.5 rounded-full flex items-center gap-2.5 border border-zinc-800 shadow-inner">
          <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.85)] flex items-center justify-center animate-pulse">
            <Coins className="w-2.5 h-2.5 text-zinc-950 font-black" />
          </div>
          <span className="text-yellow-400 font-mono font-black text-sm tracking-tight">
            {coins.toLocaleString()}
          </span>
          <button
            onClick={() => {
              playSFX('coin_collect');
              onAddCoins();
            }}
            className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center rounded-full text-xs font-black active:scale-90 transition border border-zinc-700 ml-1 cursor-pointer"
            title="Sınırsız Altın Al"
          >
            +
          </button>
        </div>

        {/* Rapid Sound Toggles */}
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 shadow-inner">
          <button
            onClick={() => {
              onToggleSound();
              playSFX('button_click');
            }}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${soundOn ? 'text-green-400 bg-green-950/40 border border-green-800/40' : 'text-zinc-500 hover:bg-zinc-800'}`}
            title="Ses Aç/Kapat"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              onToggleVibration();
              playSFX('button_click');
            }}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${vibrationOn ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40' : 'text-zinc-500 hover:bg-zinc-800'}`}
            title="Titreşim Aç/Kapat"
          >
            <Smartphone className={`w-4 h-4 ${vibrationOn ? 'animate-bounce' : ''}`} />
          </button>
          <button
            onClick={() => {
              playSFX('button_click');
              onOpenSettings();
            }}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
            title="Ayarlar"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
