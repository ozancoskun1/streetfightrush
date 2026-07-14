import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Trophy,
  Lock,
  Coins,
  Shield,
  ShoppingBag,
  Calendar,
  Gift,
  Clock,
  Flame,
  ArrowUp,
  ArrowRight,
  Settings,
  X,
  Crown,
  PlayCircle,
  BadgePercent,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playSFX } from "../utils/audio";
import { Character, PlayerProfile } from "../types";
import { getModifiedStats } from "../utils/gameData";

interface MainMenuProps {
  onNavigate: (
    screen:
      | "level_select"
      | "character_select"
      | "friend_match"
      | "settings"
      | "campaign_level_select",
  ) => void;
  activeCharacter: Character;
  playerProfile: PlayerProfile;
  matchesWon: number;
  unlockedOpponentId: number;
  coins: number;
  onClaimDailyReward: () => boolean;
  onAddCoins: () => void;
  onOpenSettings: () => void;
}

const characterImages: Record<string, string> = {
  rookie: "/characters/rookie_boxer.png",
  fast_kid: "/characters/fast_kick_kid.png",
  iron_fist: "/characters/iron_fist.png",
  tank_boxer: "/characters/tank_brawler.png",
  shadow_fighter: "/characters/shadow_fighter.png",
  muay_thai: "/characters/muay_thai_king.png",
  street_ninja: "/characters/street_ninja.png",
  dragon_warrior: "/characters/dragon_warrior.png",
  crazy_clown: "/characters/crazy_clown.png",
  cyber_puncher: "/characters/cyber_puncher.png",
  samurai: "/characters/samurai_fighter.png",
  wrestler: "/characters/wrestler_beast.png",
  kung_fu: "/characters/kung_fu_master.png",
  boxing_queen: "/characters/boxing_queen.png",
  final_boss: "/characters/final_boss.png",
};

const premiumShopCharacters = [
  {
    id: "neon_reaper",
    name: "Neon Azrail",
    subtitle: "Neon şehrin sessiz celladı",
    price: "49 TL",
    rarity: "EPİK",
    image: "/characters/neon_reaper.png",
    accent: "from-cyan-500/25 via-fuchsia-500/10 to-transparent",
    badge: "text-cyan-300 border-cyan-400/30 bg-cyan-500/10",
    button: "from-cyan-500 to-blue-600 border-blue-950",
  },
  {
    id: "inferno_titan",
    name: "Cehennem Titanı",
    subtitle: "Alevlerle güçlenen ağır savaşçı",
    price: "79 TL",
    rarity: "EFSANEVİ",
    image: "/characters/inferno_titan.png",
    accent: "from-orange-500/30 via-red-500/10 to-transparent",
    badge: "text-orange-300 border-orange-400/30 bg-orange-500/10",
    button: "from-orange-500 to-red-600 border-red-950",
  },
  {
    id: "eternal_emperor",
    name: "Ebedi İmparator",
    subtitle: "Kolezyumun yenilmez hükümdarı",
    price: "119 TL",
    rarity: "MİTİK",
    image: "/characters/eternal_emperor.png",
    accent: "from-purple-500/30 via-rose-500/10 to-transparent",
    badge: "text-purple-300 border-purple-400/30 bg-purple-500/10",
    button: "from-purple-500 to-fuchsia-600 border-fuchsia-950",
  },
] as const;

const shopCoinPackages = [
  {
    coins: "1.000",
    price: "10 TL",
    label: "BAŞLANGIÇ",
    detail: "Hızlı geliştirme paketi",
  },
  {
    coins: "2.000",
    price: "20 TL",
    label: "POPÜLER",
    detail: "Daha fazla yükseltme",
  },
  {
    coins: "5.000",
    price: "25 TL",
    label: "EN İYİ DEĞER",
    detail: "+%100 bonus avantajı",
  },
] as const;

interface HorizontalShopRailProps {
  children: React.ReactNode;
  className?: string;
}

function HorizontalShopRail({
  children,
  className = "",
}: HorizontalShopRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const rail = railRef.current;
    if (!rail) return;

    dragState.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: rail.scrollLeft,
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    const state = dragState.current;

    if (!rail || !state.active || state.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - state.startX;
    if (Math.abs(deltaX) > 5) state.moved = true;

    rail.scrollLeft = state.startScrollLeft - deltaX;
    event.preventDefault();
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    if (!state.active || state.pointerId !== event.pointerId) return;

    dragState.current.active = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.current.moved) return;

    event.preventDefault();
    event.stopPropagation();
    dragState.current.moved = false;
  };

  return (
    <div
      ref={railRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onLostPointerCapture={() => {
        dragState.current.active = false;
      }}
      onClickCapture={handleClickCapture}
      onWheel={(event) => {
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
          event.currentTarget.scrollLeft += event.deltaY;
        }
      }}
      className={`flex min-w-0 gap-3 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory pb-2 pr-2 cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ touchAction: "none", WebkitOverflowScrolling: "touch" }}
    >
      {children}
    </div>
  );
}

export default function MainMenu({
  onNavigate,
  activeCharacter,
  playerProfile,
  unlockedOpponentId,
  coins,
  onClaimDailyReward,
  onOpenSettings,
}: MainMenuProps) {
  const stats = getModifiedStats(activeCharacter);
  const [dailyReady, setDailyReady] = useState<boolean>(true);
  const [dailyTimeLeft, setDailyTimeLeft] = useState<number>(0);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const checkDaily = () => {
      if (!playerProfile.lastDailyRewardClaimed) {
        setDailyReady(true);
        setDailyTimeLeft(0);
        return;
      }
      const nextClaimTime =
        playerProfile.lastDailyRewardClaimed + 24 * 60 * 60 * 1000;
      const diff = nextClaimTime - Date.now();
      if (diff <= 0) {
        setDailyReady(true);
        setDailyTimeLeft(0);
      } else {
        setDailyReady(false);
        setDailyTimeLeft(diff);
      }
    };

    checkDaily();
    const interval = setInterval(checkDaily, 1000);
    return () => clearInterval(interval);
  }, [playerProfile.lastDailyRewardClaimed]);

  const handleClaimDaily = () => {
    if (!dailyReady) return;
    const success = onClaimDailyReward();
    if (!success) return;
    playSFX("button_click");
    setShowNotification(
      `Günlük Ödülü Topladın! 🪙 +${200 + Math.min(300, (playerProfile.dailyStreak - 1) * 50)} Altın`,
    );
    setTimeout(() => setShowNotification(null), 4000);
  };

  const [showShopModal, setShowShopModal] = useState<boolean>(false);
  const [shopImgErrors, setShopImgErrors] = useState<Record<string, boolean>>(
    {},
  );

  const handleOpenShop = () => {
    playSFX("button_click");
    setShowShopModal(true);
  };

  const showShopComingSoon = (itemName: string) => {
    playSFX("button_click");
    setShowNotification(`${itemName} yakında satın alınabilecek!`);
    setTimeout(() => setShowNotification(null), 2600);
  };

  const [imgError, setImgError] = useState<boolean>(false);

  const amateurProgress = Math.min(15, unlockedOpponentId - 1);
  const amateurLeagueCompleted = amateurProgress >= 15;

  return (
    <div className="absolute inset-0 bg-[#040406] flex flex-col p-4 select-none font-sans overflow-hidden z-10">
      {/* Visual Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-orange-950/20 via-[#040406] to-black opacity-95 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,_transparent_1px)] bg-[size:100%_4px] pointer-events-none z-0" />

      {/* Dynamic smoke & particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-orange-500/25 blur-[1px]"
            initial={{
              x: Math.random() * 1000,
              y: 520,
              scale: Math.random() * 2 + 0.5,
              opacity: 0,
            }}
            animate={{
              y: -40,
              x: `calc(${Math.random() * 100}% + ${Math.random() * 40 - 20}px)`,
              opacity: [0, 0.35, 0.35, 0],
            }}
            transition={{
              duration: Math.random() * 8 + 6,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* 3-Column Main Layout */}
      <div className="flex-1 grid grid-cols-10 gap-3 min-h-0 items-stretch z-10 relative">
        {/* ================= LEFT COLUMN (30%) ================= */}
        <div className="col-span-3 flex flex-col justify-between gap-3 min-h-0">
          {/* Active Boxer Panel */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-3 flex flex-col justify-between shadow-[0_12px_30px_rgba(0,0,0,0.6)] relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 rounded-full blur-2xl group-hover:bg-orange-600/10 transition-all duration-500" />

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-black tracking-widest text-orange-500 uppercase">
                  AKTİF BOKSÖR
                </span>
                <h3 className="text-white font-black italic text-base uppercase tracking-tight truncate max-w-[130px] mt-0.5 leading-none">
                  {activeCharacter.name}
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-orange-600/15 border border-orange-500/30 px-2 py-0.5 rounded-xl">
                <span className="text-[9px] font-black text-orange-400 italic">
                  Sv.{activeCharacter.healthLevel}
                </span>
              </div>
            </div>

            {/* Portrait area */}
            <div className="flex-1 h-20 my-1.5 flex items-center justify-center relative overflow-hidden bg-black/40 border border-zinc-900 rounded-2xl p-1 shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.06)_0%,transparent_70%)]" />
              {!imgError ? (
                <img
                  src={
                    characterImages[activeCharacter.id] ||
                    `/characters/${activeCharacter.id}.png`
                  }
                  alt={activeCharacter.name}
                  onError={() => setImgError(true)}
                  className="max-h-full max-w-[80%] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transform group-hover:scale-105 transition-all duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-4xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                  🥊
                </div>
              )}
            </div>

            {/* Progress / Stats & Action */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[8px] font-bold text-zinc-400 mb-0.5">
                  <span className="uppercase">GELİŞİM SEVİYESİ</span>
                  <span className="font-mono">
                    Sv. {activeCharacter.healthLevel}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (activeCharacter.healthLevel / 20) * 100)}%`,
                    }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-orange-600 to-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1.5 rounded-xl border border-zinc-900 shadow-inner">
                <div className="flex items-center gap-1.5 px-1">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-[7px] text-zinc-500 font-bold uppercase leading-none">
                      CAN
                    </span>
                    <span className="text-[10px] text-white font-mono font-black leading-none mt-0.5">
                      {stats.health} CAN
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-1 border-l border-zinc-900">
                  <Flame className="w-3 h-3 text-orange-500 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-[7px] text-zinc-500 font-bold uppercase leading-none">
                      GÜÇ
                    </span>
                    <span className="text-[10px] text-white font-mono font-black leading-none mt-0.5">
                      {stats.punchDamage} HASAR
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  playSFX("button_click");
                  onNavigate("character_select");
                }}
                className="w-full py-1.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 active:scale-[0.97] text-white font-black text-[10px] tracking-tight uppercase italic rounded-xl border-b-[3px] border-red-950 active:border-b-0 transition-all flex items-center justify-center gap-1 cursor-pointer group shadow-[0_4px_12px_rgba(239,68,68,0.15)] hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)]"
              >
                <ArrowUp className="w-3 h-3 text-white group-hover:-translate-y-0.5 transition-transform" />
                KARAKTERİNİ SEÇ YA DA GELİŞTİR
              </button>
            </div>
          </motion.div>
        </div>

        {/* ================= CENTER COLUMN (40%) ================= */}
        <div className="col-span-4 flex flex-col justify-between items-center gap-3 min-h-0">
          {/* Game Big Logo */}
          <div className="text-center py-2 relative shrink-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-12 bg-orange-600/10 rounded-full blur-xl pointer-events-none" />
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
              STREET{" "}
              <span className="text-orange-500 text-shadow-orange">FIGHT </span>
            </h1>
          </div>

          {/* TWO BIG GAME MODE PANELS */}
          <div className="flex-1 w-full flex flex-col gap-3 justify-center">
            {/* FIRST MODE: AMATEUR LEAGUE */}
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.7,
                delay: 0.19,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -2 }}
              className="bg-gradient-to-br from-zinc-950 to-[#101014] border border-orange-500/50 rounded-3xl p-3.5 flex flex-col justify-between shadow-[0_15px_30px_rgba(249,115,22,0.12)] relative group overflow-hidden"
              style={{ height: "48%" }}
            >
              <div className="absolute inset-0 border border-orange-500/10 rounded-3xl pointer-events-none" />
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-orange-600/5 rounded-full blur-2xl group-hover:bg-orange-600/10 transition-all duration-500" />

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[8px] font-black tracking-widest text-orange-400 uppercase leading-none">
                      LİG MODU
                    </span>
                  </div>
                  <h3 className="text-white font-black italic text-lg uppercase tracking-tight mt-1 leading-none">
                    AMATÖR LİG
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-bold mt-1">
                    15 SOKAK BÖLÜMÜ
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[7px] text-zinc-500 font-bold uppercase leading-none">
                    İLERLEME
                  </span>
                  <span className="text-orange-400 font-mono font-black text-sm leading-none mt-0.5">
                    {amateurProgress} / 15
                  </span>
                </div>
              </div>

              <div className="my-2">
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(amateurProgress / 15) * 100}%` }}
                    className="h-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  playSFX("button_click");
                  onNavigate("level_select");
                }}
                className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 active:scale-[0.98] text-white font-black text-xs uppercase italic rounded-2xl border-b-4 border-red-950 active:border-b-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_8px_20px_rgba(239,68,68,0.2)]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                HEMEN OYNA
              </button>
            </motion.div>

            {/* SECOND MODE: CAREER MODE */}
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.7,
                delay: 0.26,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={amateurLeagueCompleted ? { y: -2 } : {}}
              className={`border rounded-3xl p-3.5 flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
                amateurLeagueCompleted
                  ? "bg-gradient-to-br from-zinc-950 to-[#121216] border-orange-500/50 shadow-[0_15px_30px_rgba(249,115,22,0.12)] group"
                  : "bg-gradient-to-br from-[#101012] to-[#08080a] border-zinc-900 shadow-md opacity-75"
              }`}
              style={{ height: "48%" }}
            >
              {!amateurLeagueCompleted && (
                <div className="absolute top-3 right-3 opacity-30 text-zinc-500">
                  <Lock className="w-5 h-5" />
                </div>
              )}

              {amateurLeagueCompleted && (
                <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-orange-600/5 rounded-full blur-2xl group-hover:bg-orange-600/10 transition-all duration-500" />
              )}

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${amateurLeagueCompleted ? "bg-orange-500 animate-pulse" : "bg-zinc-600"}`}
                    />
                    <span
                      className={`text-[8px] font-black tracking-widest uppercase leading-none ${amateurLeagueCompleted ? "text-orange-400" : "text-zinc-600"}`}
                    >
                      KAMPANYA MODU
                    </span>
                  </div>
                  <h3
                    className={`font-black italic text-lg uppercase tracking-tight mt-1 leading-none ${amateurLeagueCompleted ? "text-white" : "text-zinc-500"}`}
                  >
                    KARİYER MODU
                  </h3>
                  <p
                    className={`text-[10px] font-bold mt-1 ${amateurLeagueCompleted ? "text-zinc-400" : "text-zinc-600"}`}
                  >
                    60 PROFESYONEL BÖLÜM
                  </p>
                </div>

                {!amateurLeagueCompleted && (
                  <div className="text-right text-[8px] text-zinc-600 font-bold max-w-[120px] leading-tight">
                    Kilidi açmak için Amatör Ligi tamamla.
                  </div>
                )}
              </div>

              <div className="my-1.5">
                {amateurLeagueCompleted ? (
                  <p className="text-orange-400 text-[10px] font-black italic tracking-wide animate-pulse uppercase leading-none">
                    🔥 60 SEVİYE ŞAMPİYONLUK YOLU AKTİF!
                  </p>
                ) : (
                  <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(amateurProgress / 15) * 100}%` }}
                      className="h-full bg-zinc-700"
                    />
                  </div>
                )}
              </div>

              {amateurLeagueCompleted ? (
                <button
                  onClick={() => {
                    playSFX("button_click");
                    onNavigate("campaign_level_select");
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 active:scale-[0.98] text-white font-black text-xs uppercase italic rounded-2xl border-b-4 border-red-950 active:border-b-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_8px_20px_rgba(239,68,68,0.2)]"
                >
                  <Trophy className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
                  KARİYERE BAŞLA
                </button>
              ) : (
                <div className="w-full py-2 bg-zinc-900 border border-zinc-950 text-zinc-600 text-[10px] font-black text-center uppercase rounded-2xl flex items-center justify-center gap-1.5 select-none">
                  <Lock className="w-3 h-3 text-zinc-700" />
                  KİLİTLİ
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (30%) ================= */}
        <div className="col-span-3 flex flex-col justify-between gap-3 min-h-0">
          
          {/* AYARLAR & SADE ALTIN GÖSTERGESİ */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.33, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-3 flex flex-col justify-between shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden relative group hover:border-orange-500/30"
          >
            <div className="absolute -right-8 -top-8 w-16 h-16 bg-orange-600/5 rounded-full blur-xl pointer-events-none" />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-orange-500" />
                <div>
                  <span className="text-[7px] font-black tracking-widest text-orange-500 uppercase block">
                    KONTROL PANELİ
                  </span>
                  <h4 className="text-white font-black italic text-xs uppercase leading-none mt-0.5">
                    AYARLAR
                  </h4>
                </div>
              </div>

              {/* Ayarlar Butonu */}
              <button
                onClick={() => {
                  playSFX("button_click");
                  onOpenSettings();
                }}
                className="p-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white border-b-2 border-orange-850 active:border-b-0 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md"
                title="Ayarları Aç"
              >
                <Settings className="w-3.5 h-3.5 animate-spin-slow" />
              </button>
            </div>

            {/* Sade Altın Miktarı Göstergesi */}
            <div className="flex items-center justify-between bg-black/40 border border-zinc-900 rounded-xl px-3 py-2.5 my-1 shadow-inner">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wide">TOPLAM ALTIN</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-white font-mono font-black text-sm">{coins}</span>
                <span className="text-[10px] text-yellow-500">🪙</span>
              </div>
            </div>
          </motion.div>

          {/* Sadece ARKADAŞLAR KUTUSU (KİLİTLİ) */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 bg-zinc-950/90 border border-purple-950/50 hover:border-purple-500/30 rounded-3xl p-3 flex flex-col justify-between shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden relative group"
          >
            <div className="absolute -right-8 -top-8 w-16 h-16 bg-purple-600/5 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-1.5">
              <Users className="w-4.5 h-4.5 text-purple-400" />
              <div>
                <span className="text-[7px] font-black tracking-widest text-purple-400 uppercase block">
                  SOSYAL PANEL
                </span>
                <h4 className="text-white font-black italic text-xs uppercase leading-none mt-0.5">
                  ARKADAŞLAR
                </h4>
              </div>
            </div>
            <div className="w-full">
              {/* Arkadaşlar Butonu - KİLİTLİ */}
              <div className="w-full py-3 bg-zinc-900/60 border border-zinc-950 text-zinc-600 text-xs font-black uppercase rounded-2xl flex items-center justify-center gap-2 select-none opacity-80">
                <Users className="w-4 h-4 text-zinc-700" />
                <span>ARKADAŞ SİSTEMİ ÇOK YAKINDA</span>
                <Lock className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
              </div>
            </div>
          </motion.div>

          {/* Mağaza Butonu */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.47, ease: [0.16, 1, 0.3, 1] }}
            onClick={handleOpenShop}
            className="flex-1 bg-zinc-950/90 border border-amber-950/40 hover:border-orange-500/40 rounded-3xl p-3 flex flex-col justify-between shadow-[0_10px_25px_rgba(0,0,0,0.5)] cursor-pointer transition-all duration-300 overflow-hidden relative group"
          >
            <div className="absolute -right-8 -bottom-8 w-16 h-16 bg-orange-600/5 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-4.5 h-4.5 text-orange-400" />
              <div>
                <span className="text-[7px] font-black tracking-widest text-orange-400 uppercase block">
                  MARKET
                </span>
                <h4 className="text-white font-black italic text-xs uppercase leading-none mt-0.5">
                  MAĞAZA
                </h4>
              </div>
            </div>

            <div className="flex gap-1.5 my-1 px-0.5">
              <span className="bg-orange-500/10 text-orange-400 text-[8px] font-black px-1.5 py-0.5 rounded border border-orange-500/20 leading-none">
                TEKLİFLER
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20 leading-none">
                GÜNLÜK BONUS
              </span>
            </div>

            <div className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black text-[9px] uppercase italic rounded-xl border border-zinc-800 flex items-center justify-center gap-1">
              <span>MAĞAZAYA GİR</span>
              <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Notification popup */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950 border-2 border-orange-500 text-white px-5 py-3 rounded-2xl shadow-[0_15px_40px_rgba(249,115,22,0.4)] z-[70] flex items-center gap-3 max-w-md font-sans border-t-4 border-t-orange-500"
          >
            <div className="w-8 h-8 rounded-full bg-orange-600/20 flex items-center justify-center text-lg shadow-inner shrink-0 text-orange-400">
              🏆
            </div>
            <div className="flex-1 text-xs font-black tracking-tight leading-normal uppercase italic">
              {showNotification}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8'Lİ TEK SATIR MAĞAZA MODALI */}
      <AnimatePresence>
        {showShopModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 flex items-center justify-center p-3 z-[60] backdrop-blur-md"
            onClick={() => setShowShopModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-6xl h-[78vh] min-h-[380px] bg-[#09090d] border border-orange-500/35 rounded-[30px] shadow-[0_30px_100px_rgba(0,0,0,0.85),0_0_45px_rgba(249,115,22,0.12)] relative overflow-hidden flex flex-col"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16)_0%,transparent_36%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10)_0%,transparent_34%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:100%_5px] pointer-events-none" />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 bg-black/25 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_24px_rgba(249,115,22,0.35)] shrink-0">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-black italic text-lg md:text-xl uppercase tracking-tight leading-none truncate">
                        STREET FIGHT MAĞAZASI
                      </h3>
                    </div>
                    <p className="text-zinc-500 text-[9px] md:text-[10px] mt-1 font-bold uppercase tracking-wide">
                      TÜM ÖGELER TEK BİR SATIRDA (Sola veya sağa kaydır)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 bg-black/60 border border-yellow-500/20 rounded-xl px-3 py-2 shadow-inner">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="font-mono font-black text-sm text-yellow-300">
                      {coins}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      playSFX("button_click");
                      setShowShopModal(false);
                    }}
                    className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-red-500/15 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-300 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                    aria-label="Mağazayı kapat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tek Satır / Rail İçeriği */}
              <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-center px-4 md:px-5 py-2">
                
                <div className="flex items-center justify-between gap-3 mb-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-black italic text-xs uppercase tracking-tight">
                      GÜNLÜK ÖDÜL, DÖVÜŞÇÜLER VE ALTIN REYONU
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-300 text-[8px] font-black uppercase tracking-widest">
                    <span>YANA KAYDIR</span>
                    <ArrowRight className="w-3 h-3 animate-pulse" />
                  </div>
                </div>

                {/* TEK VE BÜTÜNSEL YATAY RAY (8 ÖGE YAN YANA) */}
                <HorizontalShopRail className="py-2">
                  
                  {/* ÖGE 1: GÜNLÜK ÖDÜL KUTUSU */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    className={`relative w-[215px] md:w-[235px] h-[190px] md:h-[210px] shrink-0 snap-start rounded-2xl border p-4 text-left overflow-hidden flex flex-col justify-between transition-all ${
                      dailyReady
                        ? "border-emerald-500/50 bg-gradient-to-br from-emerald-950/20 via-zinc-950 to-emerald-900/10 shadow-[0_0_22px_rgba(16,185,129,0.15)]"
                        : "bg-zinc-950/85 border-zinc-800"
                    }`}
                  >
                    <div className="absolute -right-5 -bottom-7 text-7xl opacity-[0.05] pointer-events-none">
                      🎁
                    </div>

                    <div className="relative z-10 flex items-start justify-between gap-2">
                      <span
                        className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          dailyReady
                            ? "bg-emerald-500 text-white animate-pulse"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {dailyReady ? "HAZIR" : "BEKLEMEDE"}
                      </span>
                      {!dailyReady && (
                        <div className="flex items-center gap-1 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          <Clock className="w-2.5 h-2.5 text-zinc-500 animate-pulse" />
                          <span className="text-[8px] font-mono text-zinc-400 font-bold">
                            {formatTime(dailyTimeLeft)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 flex items-center gap-1.5 mt-2">
                      <Gift className={`w-6 h-6 ${dailyReady ? "text-emerald-400" : "text-zinc-500"}`} />
                      <span className="text-white font-mono font-black text-lg leading-none">
                        GÜNLÜK ÖDÜL
                      </span>
                    </div>

                    <p className="relative z-10 text-zinc-500 text-[8.5px] leading-snug">
                      {dailyReady
                        ? "Bugünün bedelsiz altın ödülünü hemen cüzdanına çek!"
                        : "Yeni ödül için sürenin dolmasını bekle."}
                    </p>

                    {dailyReady ? (
                      <button
                        onClick={handleClaimDaily}
                        className="relative z-10 w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-center font-black text-[9px] uppercase italic tracking-wider shadow-md cursor-pointer transition-colors"
                      >
                        ÖDÜLÜ AL 🪙
                      </button>
                    ) : (
                      <div className="relative z-10 w-full py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-500 text-center font-black text-[9px] uppercase italic select-none">
                        ALINDI
                      </div>
                    )}
                  </motion.div>

                  {/* ÖGE 2, 3, 4: PREMIUM KARAKTERLER (3 ADET) */}
                  {premiumShopCharacters.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -3 }}
                      className="group relative w-[245px] md:w-[275px] h-[190px] md:h-[210px] shrink-0 snap-start rounded-2xl border border-white/10 bg-zinc-950/85 overflow-hidden shadow-[0_12px_26px_rgba(0,0,0,0.48)]"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-b ${item.accent} opacity-90`} />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/90 to-transparent" />

                      <div className="absolute top-2 left-2 z-20">
                        <span className={`text-[7px] md:text-[8px] font-black px-2 py-1 rounded-full border uppercase tracking-widest ${item.badge}`}>
                          {item.rarity}
                        </span>
                      </div>

                      <div className="absolute top-2 right-2 z-20 rounded-lg bg-black/75 border border-white/10 px-2 py-1 text-white font-black text-[10px] md:text-xs shadow-lg">
                        {item.price}
                      </div>

                      <div className="absolute inset-x-0 top-4 bottom-12 flex items-center justify-center px-2">
                        {!shopImgErrors[item.id] ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            draggable={false}
                            onError={() =>
                              setShopImgErrors((prev) => ({
                                ...prev,
                                [item.id]: true,
                              }))
                            }
                            className="h-full max-w-[90%] object-contain pointer-events-none drop-shadow-[0_12px_20px_rgba(0,0,0,0.7)] transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-5xl md:text-6xl drop-shadow-[0_8px_15px_rgba(0,0,0,0.8)]">
                              🥊
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="absolute inset-x-2 bottom-2 z-20 flex items-end justify-between gap-2">
                        <div className="min-w-0 text-left">
                          <h5 className="text-white font-black italic text-[11px] md:text-xs uppercase truncate">
                            {item.name}
                          </h5>
                          <p className="text-zinc-500 text-[7px] md:text-[8px] mt-0.5 truncate">
                            {item.subtitle}
                          </p>
                        </div>

                        <button
                          onClick={() => showShopComingSoon(item.name)}
                          className={`shrink-0 px-3 py-2 rounded-xl bg-gradient-to-r ${item.button} border-b-4 active:border-b-0 text-white font-black italic text-[8px] md:text-[9px] uppercase tracking-wide active:scale-95 transition-all cursor-pointer shadow-lg`}
                        >
                          SATIN AL
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* ÖGE 5, 6, 7: COIN PAKETLERİ (3 ADET) */}
                  {shopCoinPackages.map((pack, index) => (
                    <motion.button
                      key={pack.coins}
                      whileHover={{ y: -3 }}
                      onClick={() =>
                        showShopComingSoon(`${pack.coins} altın paketi`)
                      }
                      className={`relative w-[215px] md:w-[235px] h-[190px] md:h-[210px] shrink-0 snap-start rounded-2xl border p-4 text-left overflow-hidden active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between ${
                        index === 2
                          ? "bg-gradient-to-br from-amber-500/20 to-orange-600/10 border-amber-400/45 shadow-[0_0_22px_rgba(245,158,11,0.10)]"
                          : "bg-zinc-950/85 border-zinc-800 hover:border-yellow-500/30"
                      }`}
                    >
                      <div className="absolute -right-5 -bottom-7 text-7xl opacity-[0.06] pointer-events-none">
                        🪙
                      </div>

                      <div className="relative z-10 flex items-start justify-between gap-2">
                        <span
                          className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            index === 2
                              ? "bg-amber-400 text-black"
                              : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {pack.label}
                        </span>
                        {index === 2 && (
                          <BadgePercent className="w-4 h-4 text-amber-300" />
                        )}
                      </div>

                      <div className="relative z-10 flex items-center gap-1.5 mt-2">
                        <Coins className="w-6 h-6 text-yellow-400" />
                        <span className="text-white font-mono font-black text-xl leading-none">
                          {pack.coins}
                        </span>
                      </div>

                      <p className="relative z-10 text-zinc-500 text-[8.5px] leading-snug">
                        {pack.detail}
                      </p>

                      <div className="relative z-10 w-full py-2 rounded-lg bg-white text-black text-center font-black text-[9px] uppercase italic">
                        {pack.price}
                      </div>
                    </motion.button>
                  ))}

                  {/* ÖGE 8: BONUS REKLAM İZLEME KARTI */}
                  <motion.button
                    whileHover={{ y: -3 }}
                    onClick={() => showShopComingSoon("Reklam ödülü")}
                    className="group relative w-[215px] md:w-[235px] h-[190px] md:h-[210px] shrink-0 snap-start rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/18 via-zinc-950 to-cyan-500/10 p-4 overflow-hidden text-left active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_24px_rgba(16,185,129,0.08)] flex flex-col justify-between"
                  >
                    <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex items-center gap-1.5">
                        <PlayCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300 font-black text-[8px] uppercase tracking-widest">
                          REKLAM İZLE
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <Coins className="w-6 h-6 text-yellow-400" />
                      <span className="text-white font-mono font-black text-2xl leading-none">
                        +120
                      </span>
                    </div>

                    <p className="text-zinc-500 text-[8.5px] leading-snug">
                      Hızlıca video reklam tamamlayarak anında bedava altın kazan.
                    </p>

                    <div className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-center font-black text-[9px] uppercase italic rounded-lg flex items-center justify-center gap-1">
                      <span>VİDEO OYNAT</span>
                    </div>
                  </motion.button>

                </HorizontalShopRail>
              </div>

              {/* Footer */}
              <div className="relative z-10 shrink-0 px-5 py-2.5 border-t border-white/10 bg-black/25 flex items-center justify-between gap-3">
                <p className="text-zinc-600 text-[8px] md:text-[9px] font-bold uppercase tracking-wide text-left">
                  Tüm ögeler tek satırdır, cüzdanınızdaki altın miktarı üstte gösterilir.
                </p>
                <button
                  onClick={() => {
                    playSFX("button_click");
                    setShowShopModal(false);
                  }}
                  className="shrink-0 px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-black text-[9px] uppercase italic rounded-xl border border-zinc-800 active:scale-95 transition-all cursor-pointer"
                >
                  MAĞAZADAN ÇIK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}