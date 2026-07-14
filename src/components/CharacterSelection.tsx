import React, { useState, useRef, useEffect } from 'react';
import { Character } from '../types';
import { getModifiedStats, isPremiumCharacter } from '../utils/gameData';
import { playSFX } from '../utils/audio';
import { Dumbbell, Zap, Coins, Check, ArrowLeft, ArrowRight, Sparkles, Shield, Target, Flame, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

interface CharacterSelectionProps {
  characters: Character[];
  selectedId: string;
  onSelect: (id: string) => void;
  onUpgrade: (id: string, statType: 'health' | 'damage' | 'heavyDamage' | 'speed' | 'cooldown') => void;
  coins: number;
  onUnlockCharacter: (id: string) => void;
  onOpenShop: () => void;
  onBack: () => void;
}

// Map character IDs to fallback images
const characterImages: Record<string, string> = {
  rookie: '/characters/rookie_boxer.png',
  fast_kid: '/characters/fast_kid.png',
  iron_fist: '/characters/iron_fist.png',
  tank_boxer: '/characters/tank_brawler.png',
  shadow_fighter: '/characters/shadow_fighter.png',
  muay_thai: '/characters/muay_thai_king.png',
  street_ninja: '/characters/street_ninja.png',
  dragon_warrior: '/characters/dragon_warrior.png',
  crazy_clown: '/characters/crazy_clown.png',
  cyber_puncher: '/characters/cyber_puncher.png',
  samurai: '/characters/samurai_fighter.png',
  wrestler: '/characters/wrestler_beast.png',
  kung_fu: '/characters/kung_fu_master.png',
  boxing_queen: '/characters/boxing_queen.png',
  final_boss: '/characters/final_boss.png',
  neon_reaper: '/characters/neon_reaper.png',
  inferno_titan: '/characters/inferno_titan.png',
  eternal_emperor: '/characters/eternal_emperor.png'
};

// Map character IDs to customized theme colors for silhouettes/glows
const characterThemeColors: Record<string, { main: string; glow: string }> = {
  rookie: { main: '#10b981', glow: 'rgba(16,185,129,0.4)' },
  fast_kid: { main: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
  iron_fist: { main: '#fbbf24', glow: 'rgba(251,191,36,0.4)' },
  tank_boxer: { main: '#6366f1', glow: 'rgba(99,102,241,0.4)' },
  shadow_fighter: { main: '#a855f7', glow: 'rgba(168,85,247,0.4)' },
  muay_thai: { main: '#f43f5e', glow: 'rgba(244,63,94,0.4)' },
  street_ninja: { main: '#22c55e', glow: 'rgba(34,197,94,0.4)' },
  crazy_clown: { main: '#d946ef', glow: 'rgba(217,70,239,0.4)' },
  dragon_warrior: { main: '#ea580c', glow: 'rgba(234,88,12,0.4)' },
  cyber_puncher: { main: '#06b6d4', glow: 'rgba(6,182,212,0.4)' },
  samurai: { main: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
  wrestler: { main: '#2563eb', glow: 'rgba(37,99,235,0.4)' },
  kung_fu: { main: '#d97706', glow: 'rgba(217,119,6,0.4)' },
  boxing_queen: { main: '#ec4899', glow: 'rgba(236,72,153,0.4)' },
  final_boss: { main: '#7c2d12', glow: 'rgba(124,45,18,0.5)' },
  neon_reaper: { main: '#22d3ee', glow: 'rgba(34,211,238,0.45)' },
  inferno_titan: { main: '#f97316', glow: 'rgba(249,115,22,0.45)' },
  eternal_emperor: { main: '#a855f7', glow: 'rgba(168,85,247,0.48)' }
};

// Gorgeous vector SVG silhouette for characters
const FighterSilhouette = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full object-contain" style={{ color }}>
    <circle cx="50" cy="20" r="11" fill="currentColor" opacity="0.9" />
    <path 
      d="M50,33 C38,33 30,39 30,50 L30,68 C30,70 31.5,71 33,71 C34.5,71 36,70 36,68 L36,54 L41,54 L41,92 C41,94.5 44.5,94.5 44.5,92 L44.5,74 L55.5,74 L55.5,92 C55.5,94.5 59,94.5 59,92 L59,54 L64,54 L64,68 C64,70 65.5,71 67,71 C68.5,71 70,70 70,68 L70,50 C70,39 62,33 50,33 Z" 
      fill="currentColor" 
    />
    <circle cx="25" cy="40" r="6" fill="currentColor" />
    <circle cx="75" cy="40" r="6" fill="currentColor" />
  </svg>
);

export default function CharacterSelection({
  characters,
  selectedId,
  onSelect,
  onUpgrade,
  coins,
  onUnlockCharacter,
  onOpenShop,
  onBack
}: CharacterSelectionProps) {
  // Find initial viewed character
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = characters.findIndex((c) => c.id === selectedId);
    return idx === -1 ? 0 : idx;
  });

  const activeChar = characters[activeIndex];
  const stats = getModifiedStats(activeChar);

  // Sparkle / Upgrade success states
  const [recentUpgrades, setRecentUpgrades] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Auto scroll to active character
  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        scrollRef.current.scrollTo({
          left: activeElement.offsetLeft - scrollRef.current.offsetWidth / 2 + activeElement.offsetWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [activeIndex]);

  const handlePrevChar = () => {
    playSFX('button_click');
    setActiveIndex((prev) => (prev - 1 + characters.length) % characters.length);
  };

  const handleNextChar = () => {
    playSFX('button_click');
    setActiveIndex((prev) => (prev + 1) % characters.length);
  };

  const handleSelectCharacter = (index: number) => {
    playSFX('button_click');
    setActiveIndex(index);
  };

  const triggerUpgradeEffect = (statType: string) => {
    setRecentUpgrades((prev) => ({ ...prev, [statType]: true }));
    setTimeout(() => {
      setRecentUpgrades((prev) => ({ ...prev, [statType]: false }));
    }, 1200);
  };

  const executeUpgrade = (statType: 'health' | 'damage' | 'heavyDamage' | 'speed' | 'cooldown') => {
    let currentLevel = 1;
    if (statType === 'health') currentLevel = activeChar.healthLevel;
    else if (statType === 'damage') currentLevel = activeChar.damageLevel;
    else if (statType === 'heavyDamage') currentLevel = activeChar.heavyDamageLevel;
    else if (statType === 'speed') currentLevel = activeChar.speedLevel;
    else if (statType === 'cooldown') currentLevel = activeChar.cooldownLevel;

    const goldCost = currentLevel * 75;

    if (coins >= goldCost && activeChar.unlocked) {
      onUpgrade(activeChar.id, statType);
      triggerUpgradeEffect(statType);
    } else {
      playSFX('button_click');
    }
  };

  const details = characterThemeColors[activeChar.id] || { main: '#ef4444', glow: 'rgba(239,68,68,0.3)' };
  const isSelected = selectedId === activeChar.id;
  const activeCharIsPremium = isPremiumCharacter(activeChar.id);

  // Custom sparkle element for upgrades
  const SparkleParticles = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: 25, opacity: 1, scale: 0.4, x: Math.random() * 80 - 40 }}
          animate={{ y: -45, opacity: 0, scale: [0.4, 1.4, 0.4], rotate: Math.random() * 360 }}
          transition={{ duration: 1.1, delay: i * 0.08, ease: "easeOut" }}
          className="absolute bottom-2 left-1/2 text-amber-400 text-sm font-bold"
        >
          ✨
        </motion.div>
      ))}
      <motion.div
        initial={{ scale: 0.8, opacity: 1 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 rounded-xl border-2 border-amber-400 bg-amber-400/20"
      />
    </div>
  );

  return (
    <div className="absolute inset-0 bg-[#060609] text-white flex flex-col p-3 select-none font-sans overflow-hidden">
      
      {/* GLOWING AMBIENT BACKGROUND */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-in-out opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${details.glow} 0%, transparent 60%)`
        }}
      />

      <button
        onClick={() => {
          playSFX('button_click');
          onBack();
        }}
        className="absolute left-[calc(env(safe-area-inset-left)+1rem)] top-[calc(env(safe-area-inset-top)+1rem)] z-50 inline-flex items-center gap-2 rounded-2xl border border-orange-500/40 bg-black/90 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-black/60 transition hover:bg-zinc-900 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4 text-orange-400" /> GERİ
      </button>

     

      {/* THREE-COLUMN LAYOUT (PERFECTLY FITS VIEWPORT, NO SCROLLING) */}
      <div className="flex-1 flex flex-row gap-3 min-h-0 overflow-hidden mt-1.5">
        
        {/* ================= SOL COLUMN (Selected Fighter Visual) ================= */}
        <div className="w-[32%] flex flex-col justify-between bg-zinc-950/80 border border-zinc-900 rounded-xl p-3 relative overflow-hidden shrink-0">
          
          {/* Subtle neon glow border */}
          <div className="absolute inset-0 border border-red-500/10 rounded-xl pointer-events-none" />

          {/* Character visual framework */}
          <div className="flex-1 flex flex-col justify-center items-center relative rounded-lg bg-gradient-to-b from-zinc-900/40 to-black/60 border border-zinc-900/60 p-2 overflow-hidden">
            
            {/* Grid ring lines in preview back */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
            
            {/* Gentle float breathing idle animation for selected character */}
            <motion.div
              key={activeChar.id}
              className="w-full h-[150px] flex items-center justify-center relative"
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Silhouette fallback or character image */}
              {!imgErrors[activeChar.id] ? (
                <img
                  src={characterImages[activeChar.id] || `/characters/${activeChar.id}.png`}
                  alt={activeChar.name}
                  onError={() => setImgErrors(prev => ({ ...prev, [activeChar.id]: true }))}
                  className="max-h-full max-w-[85%] object-contain select-none pointer-events-none transition-all duration-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-32 h-32 transition-all duration-300">
                  <FighterSilhouette color={details.main} />
                </div>
              )}
            </motion.div>

            {/* Character Base Shadow */}
            <div className="w-24 h-2 bg-black/60 rounded-full blur-[2px] mt-1 shrink-0" />
            
            {/* Character Info Label */}
            <div className="text-center mt-2 shrink-0 w-full px-1">
              <h3 className="text-sm font-black italic tracking-wide uppercase text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {activeChar.name}
              </h3>
              <p className="text-[9px] text-zinc-400 italic leading-none truncate max-w-full mt-1 px-1">
                {activeChar.description}
              </p>
              {!activeChar.unlocked && (
                <span
                  className={`inline-flex mt-2 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                    activeCharIsPremium
                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {activeCharIsPremium ? 'MARKET KARAKTERİ' : 'KİLİTLİ'}
                </span>
              )}
            </div>
          </div>

          {/* SOL TARAF BUTTON: Select / Unlock (Interactive) */}
          <div className="mt-2.5 shrink-0">
            {activeChar.unlocked ? (
              <button
                onClick={() => {
                  if (!isSelected) {
                    playSFX('button_click');
                    onSelect(activeChar.id);
                  }
                }}
                disabled={isSelected}
                className={`w-full py-2 rounded-lg font-black text-xs uppercase tracking-wider italic flex items-center justify-center gap-1.5 transition-all shadow-md transform border ${
                  isSelected
                    ? 'bg-zinc-950 border-emerald-500/30 text-emerald-400 cursor-default shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                    : 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 border-red-500 active:scale-95 text-white cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                }`}
              >
                {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                {isSelected ? 'AKTİF SEÇİLİ' : 'BOKSÖRÜ SEÇ'}
              </button>
            ) : activeCharIsPremium ? (
              <button
                onClick={() => {
                  playSFX('button_click');
                  onOpenShop();
                }}
                className="w-full py-2 rounded-lg font-black text-xs uppercase tracking-wider italic flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 border border-orange-400 text-white shadow-[0_0_14px_rgba(249,115,22,0.24)] active:scale-95 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                SATIN AL
              </button>
            ) : (
              <div className="w-full py-2 rounded-lg font-black text-xs uppercase tracking-wider italic flex items-center justify-center gap-1.5 bg-zinc-950/80 border border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.12)]">
                KİLİTLİ
              </div>
            )}
          </div>
        </div>

        {/* ================= ORTA COLUMN (Yatay Karakter Listesi & Arrows) ================= */}
        <div className="w-[38%] flex flex-col justify-between bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-3 overflow-hidden">
          
          {/* Quick Carousel Switching Banner */}
          <div className="flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-lg p-1 shrink-0">
            <button 
              onClick={handlePrevChar}
              className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="text-center flex flex-col justify-center">
              <span className="font-mono text-[9px] text-red-500 font-black tracking-widest leading-none">KARAKTER KATALOĞU</span>
              <span className="font-mono text-[8px] text-zinc-500 mt-0.5">{activeIndex + 1} / {characters.length} BOKSÖR</span>
            </div>
            <button 
              onClick={handleNextChar}
              className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Yatay Karakter Listesi (Yana Kaydırmalı Grid/Flex) */}
          <div className="flex-1 flex flex-col justify-center my-3 overflow-hidden">
            <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider mb-1.5 block">
              DÖVÜŞÇÜLER (YANA KAYDIRILABİLİR)
            </span>
            
            <div 
              ref={scrollRef}
              className="flex flex-row gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950/50 scroll-smooth select-none max-h-full items-center"
            >
              {characters.map((char, index) => {
                const isViewing = index === activeIndex;
                const isCurrentSelected = char.id === selectedId;
                const themeColors = characterThemeColors[char.id] || { main: '#ef4444', glow: 'rgba(239,68,68,0.2)' };
                
                return (
                  <div
                    key={char.id}
                    onClick={() => handleSelectCharacter(index)}
                    className={`min-w-[155px] max-w-[155px] h-[58px] flex flex-row items-center p-1.5 rounded-xl border transition-all cursor-pointer select-none relative shrink-0 ${
                      isViewing 
                        ? 'border-red-500 bg-red-950/15 shadow-[0_0_10px_rgba(239,68,68,0.25)] scale-102' 
                        : char.unlocked 
                          ? 'border-zinc-850 bg-zinc-900/80 hover:border-zinc-700 hover:scale-102' 
                          : 'border-zinc-850 bg-zinc-900/80 hover:border-zinc-700 hover:scale-102'
                    }`}
                  >
                    {/* Tiny Check for Selected */}
                    {isCurrentSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-zinc-950 flex items-center justify-center shadow-md z-10">
                        <Check className="w-2.5 h-2.5 text-zinc-950 stroke-[3]" />
                      </div>
                    )}

                    {/* Small visual on left */}
                    <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative mr-2">
                      {!imgErrors[char.id] ? (
                        <img
                          src={characterImages[char.id] || `/characters/${char.id}.png`}
                          alt={char.name}
                          onError={() => setImgErrors(prev => ({ ...prev, [char.id]: true }))}
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-7 h-7">
                          <FighterSilhouette color={themeColors.main} />
                        </div>
                      )}
                    </div>

                    {/* Text block */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-[10px] font-black uppercase tracking-wide truncate text-zinc-100">
                        {char.name}
                      </span>
                      {char.unlocked ? (
                        <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">
                          HAZIR
                        </span>
                      ) : isPremiumCharacter(char.id) ? (
                        <span className="text-[8px] font-mono font-bold text-orange-400 uppercase tracking-wider">
                          SATIN AL
                        </span>
                      ) : (
                        <span className="text-[8px] font-mono font-bold text-red-400 uppercase tracking-wider">
                          KİLİTLİ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick instructions indicator */}
          <div className="bg-black/40 border border-zinc-900 rounded-lg p-2 text-center shrink-0">
            <span className="text-[8.5px] text-zinc-500 font-bold leading-tight block">
              💡 Karakterler arasında hızlı geçiş için YÖN OKLARINI kullanın veya doğrudan dövüşçülere tıklayın.
            </span>
          </div>

        </div>

        {/* ================= SAĞ COLUMN (Karakter Stats & Upgrade Area) ================= */}
        <div className="w-[30%] flex flex-col justify-between bg-zinc-950/80 border border-zinc-900 rounded-xl p-3 shrink-0 overflow-hidden">
          
          {/* 1. Karakter İstatistikleri */}
          <div className="shrink-0">
            <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">
              BOKSÖR ÖZNİTELİKLERİ
            </span>
            <div className="bg-black/50 border border-zinc-900 rounded-lg p-2 space-y-1.5">
              
              {/* CAN Stat */}
              <div className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-red-500" />
                  <span className="text-zinc-400 font-bold uppercase">CAN</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-100 font-black">{stats.health}</span>
                  <div className="w-16 h-1.5 bg-zinc-900 rounded-sm overflow-hidden">
                    <div className="h-full bg-red-500 rounded-sm shadow-[0_0_6px_rgba(239,68,68,0.5)]" style={{ width: `${Math.min(100, (stats.health / 350) * 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* GÜÇ Stat */}
              <div className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-zinc-400 font-bold uppercase">GÜÇ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-100 font-black">{stats.punchDamage}</span>
                  <div className="w-16 h-1.5 bg-zinc-900 rounded-sm overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-sm shadow-[0_0_6px_rgba(249,115,22,0.5)]" style={{ width: `${Math.min(100, (stats.punchDamage / 30) * 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* HIZ Stat */}
              <div className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-500" />
                  <span className="text-zinc-400 font-bold uppercase">HIZ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-100 font-black">{stats.speed.toFixed(1)}</span>
                  <div className="w-16 h-1.5 bg-zinc-900 rounded-sm overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-sm shadow-[0_0_6px_rgba(6,182,212,0.5)]" style={{ width: `${Math.min(100, (stats.speed / 7.5) * 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* TEKNİK Stat */}
              <div className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-purple-500" />
                  <span className="text-zinc-400 font-bold uppercase">TEKNİK</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-100 font-black">{activeChar.cooldownLevel}</span>
                  <div className="w-16 h-1.5 bg-zinc-900 rounded-sm overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-sm shadow-[0_0_6px_rgba(168,85,247,0.5)]" style={{ width: `${Math.min(100, (activeChar.cooldownLevel / 10) * 100)}%` }} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 2. Stat Upgrade Alanı */}
          <div className="flex-1 flex flex-col justify-end mt-2 overflow-hidden min-h-0">
            <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">
              GÜÇLENDİRMELER (UPGRADES)
            </span>
            
            <div className="space-y-1 overflow-y-auto max-h-[170px] pr-1 scrollbar-thin">
              {[
                { label: 'Health Upgrade', type: 'health' as const, level: activeChar.healthLevel, icon: <Shield className="w-3 h-3 text-red-500" /> },
                { label: 'Punch Damage', type: 'damage' as const, level: activeChar.damageLevel, icon: <Flame className="w-3 h-3 text-orange-500" /> },
                { label: 'Kick Damage', type: 'heavyDamage' as const, level: activeChar.heavyDamageLevel, icon: <Dumbbell className="w-3 h-3 text-yellow-500" /> },
                { label: 'Special Damage', type: 'cooldown' as const, level: activeChar.cooldownLevel, icon: <Target className="w-3 h-3 text-purple-500" /> }
              ].map((up) => {
                const goldCost = up.level * 75;
                const canAffordCoins = coins >= goldCost;
                const canUpgrade = canAffordCoins && activeChar.unlocked;

                return (
                  <div 
                    key={up.type} 
                    className="relative bg-black/60 border border-zinc-900 rounded-lg p-1.5 flex flex-row items-center justify-between gap-1.5 hover:border-zinc-800 transition-all"
                  >
                    {/* Sparkles celebration overlay if recently upgraded */}
                    {recentUpgrades[up.type] && <SparkleParticles />}

                    {/* Left: icon, level, and progress bar */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1">
                        {up.icon}
                        <span className="text-[9px] font-black uppercase text-zinc-100 truncate">{up.label}</span>
                        <span className="text-[7.5px] font-mono text-zinc-500 font-bold leading-none">LVL {up.level}</span>
                      </div>
                      
                      {/* Progress info */}
                      <div className="mt-1 text-[8px] text-zinc-400 font-bold">
                        <span>Gereken Altın: {goldCost}</span>
                      </div>
                    </div>

                    {/* Right: Price & Button */}
                    <button
                      onClick={() => executeUpgrade(up.type)}
                      disabled={!canUpgrade}
                      className={`h-7 px-2.5 rounded font-black text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all shrink-0 ${
                        canUpgrade
                          ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:brightness-110 active:scale-95 text-white shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                          : 'bg-zinc-900 border border-zinc-950 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-2.5 h-2.5 text-yellow-500" />
                      <span>{goldCost}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
