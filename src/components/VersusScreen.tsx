import React from 'react';
import { Character, Opponent } from '../types';
import { getModifiedStats } from '../utils/gameData';
import { playSFX } from '../utils/audio';
import { ArrowLeft, Shield, Flame, Zap, Target, Swords } from 'lucide-react';
import { motion } from 'motion/react';

interface VersusScreenProps {
  player: Character;
  opponent: Opponent;
  matchLabel?: string;
  arenaName?: string;
  onStartFight: () => void;
  onBack: () => void;
}

const CHARACTER_FOLDERS: Record<string, string> = {
  rookie: 'rookie_boxer',
  fast_kid: 'fast_kick_kid',
  iron_fist: 'iron_fist',
  tank_boxer: 'tank_brawler',
  shadow_fighter: 'shadow_fighter',
  muay_thai: 'muay_thai_king',
  street_ninja: 'street_ninja',
  dragon_warrior: 'dragon_warrior',
  crazy_clown: 'crazy_clown',
  cyber_puncher: 'cyber_puncher',
  samurai: 'samurai_fighter',
  wrestler: 'wrestler_beast',
  kung_fu: 'kung_fu_master',
  boxing_queen: 'boxing_queen',
  final_boss: 'final_boss'
};

/**
 * Rakiplerin isimleri farklı olsa da mevcut 15 ana karakterden
 * hangisinin görselini kullanacaklarını burada belirliyoruz.
 */
const OPPONENT_CHARACTER_IDS: Record<string, string> = {
  'Street Rookie': 'rookie',
  'Fast Kid': 'fast_kick_kid',
  'Shaolin Iron Monk': 'monk_fighter',
  'Brawler Titan': 'tank_boxer',
  'Nightshade Shadow': 'shadow_fighter',
  'Siam Cyclone': 'muay_thai',
  'Saber Shinobi': 'street_ninja',
  'Crazy Dan Jester': 'crazy_clown',
  'Aurelius Dragon': 'dragon_warrior',
  'Cyber X Crusher': 'cyber_puncher',
  'Samurai Katashi': 'samurai',
  'Bison El Macho': 'wrestler',
  'Grandmaster Lee': 'kung_fu',
  'Golden Boxing Queen': 'boxing_queen',
  'Nihil Dark Lord': 'final_boss'
};

function fighterImage(id: string) {
  const folder = CHARACTER_FOLDERS[id] || id;
  return `/characters/${folder}/idle.png`;
}

function opponentFighterImage(opponent: Opponent) {
  const characterId =
    OPPONENT_CHARACTER_IDS[opponent.name] ||
    opponent.characterId ||
    'rookie';

  return fighterImage(characterId);
}

function StatRow({
  icon,
  label,
  playerValue,
  opponentValue,
  max,
  index
}: {
  icon: React.ReactNode;
  label: string;
  playerValue: number;
  opponentValue: number;
  max: number;
  index: number;
}) {
  const p = Math.max(5, Math.min(100, (playerValue / max) * 100));
  const o = Math.max(5, Math.min(100, (opponentValue / max) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, type: 'spring', stiffness: 120 }}
      className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1"
    >
      {/* Sol (Oyuncu) Barı */}
      <div className="flex items-center justify-end gap-1.5">
        <span className="font-mono text-[10px] md:text-xs font-bold text-orange-400">
          {Math.round(playerValue * 10) / 10}
        </span>

        <div className="w-full max-w-[80px] md:max-w-[160px] h-1 bg-white/5 overflow-hidden rounded-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${p}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="h-full bg-gradient-to-l from-orange-500 to-red-500 ml-auto rounded-full shadow-[0_0_6px_rgba(249,115,22,0.5)]"
          />
        </div>
      </div>

      {/* Merkez İkon */}
      <div className="w-14 md:w-20 flex flex-col items-center justify-center">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">
          {label}
        </span>
      </div>

      {/* Sağ (Rakip) Barı */}
      <div className="flex items-center gap-1.5">
        <div className="w-full max-w-[80px] md:max-w-[160px] h-1 bg-white/5 overflow-hidden rounded-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${o}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.5)]"
          />
        </div>

        <span className="font-mono text-[10px] md:text-xs font-bold text-cyan-400">
          {Math.round(opponentValue * 10) / 10}
        </span>
      </div>
    </motion.div>
  );
}

export default function VersusScreen({
  player,
  opponent,
  matchLabel = `MAÇ #${opponent.id}`,
  arenaName = 'AMATÖR ARENA',
  onStartFight,
  onBack
}: VersusScreenProps) {
  const stats = getModifiedStats(player);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#04060a] text-white select-none safe-bottom">
      {/* Işıklar */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(249,115,22,0.06),transparent_55%)]" />
      <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-red-950/10 to-transparent opacity-60" />
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-blue-950/10 to-transparent opacity-60" />

      {/* Üst Alan */}
      <div className="absolute top-3 inset-x-0 text-center z-30 px-16">
        <span className="text-orange-500/80 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em] block">
          {arenaName}
        </span>

        <h1 className="text-sm md:text-xl font-black uppercase tracking-wider bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent truncate">
          {matchLabel}
        </h1>
      </div>

      {/* Geri Butonu */}
      <button
        onClick={() => {
          playSFX('button_click');
          onBack();
        }}
        className="absolute left-4 top-3.5 z-50 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/5 bg-zinc-900/40 backdrop-blur-sm active:scale-90 transition-transform"
      >
        <ArrowLeft className="w-4 h-4 text-zinc-400" />
      </button>

      {/* Tek Ekran Esnek Yapı */}
      <div className="h-full flex flex-col justify-center pt-12 pb-4 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full relative">
          {/* SOL: Oyuncu */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-0"
          >
            <div className="w-full flex items-center justify-center relative">
              <div className="absolute w-32 h-32 bg-orange-600/5 blur-[50px] rounded-full" />

              <img
                src={fighterImage(player.id)}
                alt={player.name}
                className="max-h-[160px] sm:max-h-[220px] md:max-h-[320px] w-auto object-contain drop-shadow-[0_15px_20px_rgba(0,0,0,0.7)]"
              />
            </div>

            <div className="text-center mt-2 px-1">
              <h2 className="text-xs sm:text-base md:text-2xl font-black uppercase tracking-tight text-orange-400 line-clamp-1">
                {player.name}
              </h2>

              <span className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-wider block line-clamp-1">
                {player.description}
              </span>
            </div>
          </motion.div>

          {/* ORTA: VS, Buton ve Statlar */}
          <div className="w-[150px] sm:w-[220px] md:w-[320px] flex flex-col items-center justify-center px-1 z-20">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl md:text-5xl font-black italic tracking-tighter bg-gradient-to-b from-white via-zinc-300 to-zinc-600 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
            >
              VS
            </motion.div>

            {/* Savaş Butonu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="my-3 w-full flex justify-center"
            >
              <button
                onClick={() => {
                  playSFX('button_click');
                  onStartFight();
                }}
                className="group w-full max-w-[140px] sm:max-w-[180px] py-2 rounded-lg bg-white text-black font-black uppercase tracking-widest text-[9px] sm:text-[11px] shadow-[0_0_20px_rgba(255,255,255,0.08)] hover:bg-orange-500 hover:text-white active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-white/15"
              >
                <Swords className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                SAVAŞ
              </button>
            </motion.div>

            {/* Şeffaf Stat Çizgileri */}
            <div className="w-full space-y-0.5 border-t border-b border-white/[0.03] py-2">
              <StatRow
                icon={<Shield className="w-3 h-3 text-red-400" />}
                label="CAN"
                playerValue={stats.health}
                opponentValue={opponent.health}
                max={650}
                index={0}
              />

              <StatRow
                icon={<Flame className="w-3 h-3 text-orange-400" />}
                label="GÜÇ"
                playerValue={stats.punchDamage}
                opponentValue={opponent.damage}
                max={35}
                index={1}
              />

              <StatRow
                icon={<Zap className="w-3 h-3 text-cyan-400" />}
                label="HIZ"
                playerValue={stats.speed}
                opponentValue={opponent.speed}
                max={8}
                index={2}
              />

              <StatRow
                icon={<Target className="w-3 h-3 text-purple-400" />}
                label="TEKNİK"
                playerValue={player.cooldownLevel}
                opponentValue={Math.max(1, opponent.id / 2)}
                max={10}
                index={3}
              />
            </div>
          </div>

          {/* SAĞ: Rakip */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-0"
          >
            <div className="w-full flex items-center justify-center relative">
              <div className="absolute w-32 h-32 bg-cyan-600/5 blur-[50px] rounded-full" />

              <img
                src={opponentFighterImage(opponent)}
                alt={opponent.name}
                className="max-h-[160px] sm:max-h-[220px] md:max-h-[320px] w-auto object-contain scale-x-[-1] drop-shadow-[0_15px_20px_rgba(0,0,0,0.7)]"
              />
            </div>

            <div className="text-center mt-2 px-1">
              <h2 className="text-xs sm:text-base md:text-2xl font-black uppercase tracking-tight text-cyan-400 line-clamp-1">
                {opponent.name}
              </h2>

              <span className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-wider block line-clamp-1">
                RAKİP
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}