import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Users, Shield, Sparkles } from 'lucide-react';
import { Character, Opponent } from '../types';
import { getModifiedStats } from '../utils/gameData';
import { playSFX } from '../utils/audio';
interface FriendMatchProps {
  activeCharacter: Character;
  availableOpponents: Opponent[];
  onStartMatch: (opponent: Opponent) => void;
  onBack: () => void;
}

export default function FriendMatch({
  activeCharacter,
  availableOpponents,
  onStartMatch,
  onBack
}: FriendMatchProps) {
  const stats = getModifiedStats(activeCharacter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 overflow-hidden bg-[#040406] p-4 select-none font-sans"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.06)_0%,transparent_55%)] pointer-events-none" />
      <div className="relative z-10 grid grid-cols-10 gap-3 min-h-0 h-full">
        <div className="col-span-3 flex flex-col gap-3">
          <button
            onClick={() => {
              playSFX('button_click');
              onBack();
            }}
            className="w-full py-2 bg-zinc-900 border border-zinc-800 rounded-3xl text-zinc-300 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition"
          >
            <span className="inline-flex items-center gap-2 justify-center">
              <ArrowLeft className="w-4 h-4" /> GERİ
            </span>
          </button>

          <div className="flex-1 bg-zinc-950/90 border border-cyan-900 rounded-3xl p-4 flex flex-col justify-between shadow-[0_15px_30px_rgba(14,165,233,0.1)]">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600/15 flex items-center justify-center text-cyan-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[8px] text-cyan-400 uppercase tracking-widest font-black">Dost Maçı</p>
                  <h2 className="text-white font-black text-lg uppercase tracking-tight mt-1">Rakip Seçimi</h2>
                </div>
              </div>
              <p className="text-zinc-400 text-[11px] leading-snug">
                Açtığın rakip havuzundan seçerek arkadaşına meydan oku. Anlık eşleşme için hazır!
              </p>
            </div>

            <div className="mt-4 rounded-3xl bg-black/40 border border-zinc-900 p-3">
              <div className="flex items-center justify-between text-[9px] text-zinc-400 uppercase font-bold tracking-widest mb-2">
                <span>Aktif Dövüşçü</span>
                <span>Güç</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl text-white">
                  {activeCharacter.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-white font-black text-sm uppercase leading-none">{activeCharacter.name}</p>
                  <p className="text-zinc-400 text-[10px] mt-2">{stats.health} HP • {stats.punchDamage} DMG</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-7 flex flex-col gap-3">
          <div className="bg-zinc-950/90 border border-cyan-900 rounded-3xl p-4 shadow-[0_15px_30px_rgba(14,165,233,0.1)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[8px] text-cyan-400 uppercase tracking-widest font-black">Rakip Havuzu</span>
                <h3 className="text-white font-black text-xl uppercase tracking-tight mt-1">Mevcut Rakipler</h3>
              </div>
              <div className="rounded-2xl bg-cyan-500/10 px-3 py-2 text-[10px] text-cyan-200 font-black uppercase tracking-[0.15em]">
                {availableOpponents.length} AÇIK
              </div>
            </div>
            <p className="text-zinc-400 text-[11px] mt-3">
              Her rakip, kazandığın maçlara göre açıldı. Seçimini yap ve arkadaş maçı başlat.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {availableOpponents.length === 0 ? (
              <div className="rounded-3xl bg-zinc-950/90 border border-zinc-800 p-6 text-zinc-400 text-sm text-center">
                Henüz açılmış rakip yok. Maç kazanarak yeni rakipleri açabilirsin.
              </div>
            ) : availableOpponents.map(opponent => (
              <motion.div
                key={opponent.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-3xl bg-zinc-950/90 border border-zinc-900 p-4 grid grid-cols-[auto_1fr_auto] gap-4 items-center"
              >
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-2xl ${opponent.color} ${opponent.accentColor}`}>
                  {opponent.avatar}
                </div>
                <div>
                  <p className="text-white font-black uppercase tracking-tight leading-none">{opponent.name}</p>
                  <p className="text-zinc-400 text-[10px] mt-1">HP {opponent.health} • DMG {opponent.damage} • Hız {opponent.speed}</p>
                </div>
                <button
                  onClick={() => {
                    playSFX('button_click');
                    onStartMatch(opponent);
                  }}
                  className="px-4 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-[10px] tracking-[0.15em] transition"
                >
                  SEÇ
                </button>
              </motion.div>
            ))}
          </div>

          <div className="rounded-3xl bg-zinc-950/90 border border-zinc-900 p-4 grid gap-3">
            <div className="flex items-center gap-2 text-cyan-300 text-[10px] uppercase tracking-[0.2em] font-black">
              <Sparkles className="w-4 h-4" />
              İPUCU
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Açtığın rakip havuzuna göre arkadaş maçları daha zorlu hale gelir. Önce aktif dövüşçünü güçlendir ve altınla geliştirme yap.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
