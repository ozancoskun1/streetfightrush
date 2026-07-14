declare module 'react';
import React from 'react';
import { Volume2, VolumeX, Smartphone, HelpCircle, Gamepad2, ArrowLeft, ArrowRight, Shield, Zap } from 'lucide-react';
import { playSFX } from '../utils/audio';

interface SettingsPanelProps {
  soundOn: boolean;
  vibrationOn: boolean;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onClose: () => void;
}

export default function SettingsPanel({
  soundOn,
  vibrationOn,
  onToggleSound,
  onToggleVibration,
  onClose
}: SettingsPanelProps) {
  return (
    <div className="absolute inset-0 bg-transparent p-4 select-none font-sans overflow-y-auto flex flex-col items-center">
      
      {/* BACKGROUND GRAPHIC */}
      <h1 className="absolute top-10 left-1/2 -translate-x-1/2 text-7xl md:text-9xl font-black italic tracking-tighter text-zinc-900 select-none opacity-20 uppercase whitespace-nowrap z-0">
        AYARLAR
      </h1>

      <div className="w-full max-w-2xl bg-[#161616]/95 rounded-3xl border-2 border-zinc-800 p-6 flex flex-col gap-6 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 italic">
            <Gamepad2 className="w-5 h-5 text-orange-500 animate-pulse" />
            OYUN AYARLARI & REHBERİ
          </h2>
          <button
            onClick={() => {
              playSFX('button_click');
              onClose();
            }}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white border-b-4 border-orange-950 active:border-b-0 font-black text-xs uppercase italic rounded-xl transition-all cursor-pointer"
          >
            GERİ DÖN
          </button>
        </div>

        {/* Option Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sound Toggle */}
          <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/60 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#121212] rounded-xl text-orange-500 border border-zinc-800">
                {soundOn ? <Volume2 className="w-5 h-5 animate-bounce" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-xs uppercase italic">Oyun Sesleri</span>
                <span className="text-zinc-500 text-[10px] font-mono uppercase mt-0.5">Sfx ve müzik</span>
              </div>
            </div>
            <button
              onClick={() => {
                onToggleSound();
                playSFX('button_click');
              }}
              className={`px-4 py-2 rounded-xl font-black text-xs uppercase italic tracking-wider border-b-4 transition-all cursor-pointer ${
                soundOn 
                  ? 'bg-orange-600 text-white border-orange-950 hover:bg-orange-500' 
                  : 'bg-zinc-800 text-zinc-400 border-zinc-950 hover:bg-zinc-700'
              }`}
            >
              {soundOn ? 'AÇIK' : 'KAPALI'}
            </button>
          </div>

          {/* Vibration Toggle */}
          <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/60 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#121212] rounded-xl text-orange-500 border border-zinc-800">
                <Smartphone className={`w-5 h-5 ${vibrationOn ? 'animate-bounce' : ''}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-xs uppercase italic">Titreşim</span>
                <span className="text-zinc-500 text-[10px] font-mono uppercase mt-0.5">Vuruş geri bildirimi</span>
              </div>
            </div>
            <button
              onClick={() => {
                onToggleVibration();
                playSFX('button_click');
              }}
              className={`px-4 py-2 rounded-xl font-black text-xs uppercase italic tracking-wider border-b-4 transition-all cursor-pointer ${
                vibrationOn 
                  ? 'bg-orange-600 text-white border-orange-950 hover:bg-orange-500' 
                  : 'bg-zinc-800 text-zinc-400 border-zinc-950 hover:bg-zinc-700'
              }`}
            >
              {vibrationOn ? 'AÇIK' : 'KAPALI'}
            </button>
          </div>
        </div>

        {/* Detailed Controls Guide */}
        <div className="flex flex-col gap-4">
          <h3 className="text-orange-500 font-black italic text-xs uppercase tracking-widest flex items-center gap-1.5 border-b border-zinc-800 pb-2">
            <HelpCircle className="w-4 h-4 text-orange-500" />
            NASIL OYNANIR - KONTROL REHBERİ
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Left Controls manual */}
            <div className="bg-black/20 p-4 rounded-2xl border border-zinc-800/60 space-y-3">
              <h4 className="text-orange-500 font-black italic text-xs uppercase tracking-wider">SOL HAREKET BUTONLARI</h4>
              
              <div className="flex gap-2.5 items-start">
                <span className="p-1 bg-zinc-800 rounded-lg text-white font-black text-xs font-mono border border-zinc-700 shrink-0 w-10 text-center uppercase italic">SOL</span>
                <p className="text-zinc-400 text-xs leading-normal">Karakterinizi sola hareket ettirir, rakipten kaçmak için kullanılır.</p>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="p-1 bg-zinc-800 rounded-lg text-white font-black text-xs font-mono border border-zinc-700 shrink-0 w-10 text-center uppercase italic">SAĞ</span>
                <p className="text-zinc-400 text-xs leading-normal">Karakterinizi sağa hareket ettirir, rakibe yaklaşarak boks mesafesine girmenizi sağlar.</p>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="p-1 bg-zinc-800 rounded-lg text-white font-black text-xs font-mono border border-zinc-700 shrink-0 w-10 text-center uppercase italic">EĞİL</span>
                <p className="text-zinc-400 text-xs leading-normal">Boksörünüz eğilir ve gard pozisyonuna geçer. Rakibin yumruklarından %75 daha az hasar alırsınız!</p>
              </div>
            </div>

            {/* Right Attack controls manual */}
            <div className="bg-black/20 p-4 rounded-2xl border border-zinc-800/60 space-y-3">
              <h4 className="text-orange-500 font-black italic text-xs uppercase tracking-wider">SAĞ SALDIRI BUTONLARI</h4>
              
              <div className="flex gap-2.5 items-start">
                <span className="p-1 bg-zinc-800 rounded-lg text-white font-black text-[10px] font-mono border border-zinc-700 shrink-0 w-10 text-center uppercase italic">DÜZ</span>
                <p className="text-zinc-400 text-xs leading-normal">Hızlı hafif yumruk. Cooldown süresi çok kısadır, seri kombolar yapmak için idealdir.</p>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="p-1 bg-zinc-800 rounded-lg text-white font-black text-[10px] font-mono border border-zinc-700 shrink-0 w-10 text-center uppercase italic">GÜÇLÜ</span>
                <p className="text-zinc-400 text-xs leading-normal">Ağır aparkat veya direkt yumruk. Yüksek hasar verir fakat kısa bir cooldown süresi bulunur.</p>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="p-1 bg-zinc-800 rounded-lg text-white font-black text-[10px] font-mono border border-zinc-700 shrink-0 w-10 text-center uppercase italic">ÖZEL</span>
                <p className="text-zinc-400 text-xs leading-normal">Fırlatma / Özel Boks Darbesi. Rakibi geriye fırlatır, çok yüksek hasar verir. Cooldown süresi uzundur.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Version details / About */}
        <div className="text-center text-[10px] text-zinc-600 font-mono mt-2 tracking-widest uppercase">
          STREET FIGHT  RUSH v1.0.0 (MVP) • CODESYNTHESIZER V3.0
        </div>

      </div>
    </div>
  );
}
