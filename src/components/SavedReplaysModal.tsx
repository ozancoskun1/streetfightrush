import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Video, Trash2, Calendar, Trophy } from 'lucide-react';
import { playSFX } from '../utils/audio';

interface SavedReplay {
  id: string;
  date: string;
  playerCharId: string;
  playerCharName: string;
  opponentId: number;
  opponentName: string;
  opponentAvatar: string;
  result: 'win' | 'lose';
  levelName: string;
  snapshots: any[];
  events: any[];
}

interface SavedReplaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayReplay: (replay: SavedReplay) => void;
}

export default function SavedReplaysModal({ isOpen, onClose, onPlayReplay }: SavedReplaysModalProps) {
  const [replays, setReplays] = useState<SavedReplay[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadReplays();
    }
  }, [isOpen]);

  const loadReplays = () => {
    try {
      const stored = localStorage.getItem('boxing_saved_replays');
      if (stored) {
        setReplays(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading replays', e);
    }
  };

  const handleDeleteReplay = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSFX('button_click');
    try {
      const updated = replays.filter(r => r.id !== id);
      setReplays(updated);
      localStorage.setItem('boxing_saved_replays', JSON.stringify(updated));
    } catch (err) {
      console.error('Error deleting replay', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm font-sans select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-[#101014] border-2 border-zinc-800 rounded-[32px] p-5 text-center shadow-2xl relative overflow-hidden flex flex-col max-h-[90%]"
      >
        {/* Ambient neon styling */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.1)_0%,transparent_70%)] pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-black italic text-sm md:text-base uppercase tracking-tight leading-none">
              MAÇ TEKRAR DEPOSU
            </h3>
          </div>
          <button
            onClick={() => {
              playSFX('button_click');
              onClose();
            }}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-zinc-500 text-[10px] md:text-xs text-left mb-3 font-semibold px-1">
          Son yaptığın 8 maçın anlık oyuncu hareketleri, vuruşları ve özel animasyonları otomatik kaydedilir. Tekrarları izleyip taktik geliştirebilirsin!
        </p>

        {/* Replays List Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0 custom-scrollbar">
          {replays.length === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center gap-3 border border-zinc-900/50 rounded-2xl bg-zinc-950/30">
              <span className="text-4xl">📹</span>
              <p className="text-zinc-500 text-xs font-bold text-center max-w-xs leading-relaxed">
                Henüz kayıtlı bir maç tekrarı yok! <br />
                <span className="text-orange-500">Amatör Lig</span> veya <span className="text-purple-400">Şampiyonluk Yolu</span> maçları yaptıktan sonra otomatik buraya kaydedilir.
              </p>
            </div>
          ) : (
            replays.map((rep) => (
              <div
                key={rep.id}
                onClick={() => {
                  playSFX('button_click');
                  onPlayReplay(rep);
                }}
                className="group bg-zinc-950/80 border border-zinc-850 hover:border-purple-500/40 p-3 rounded-2xl flex items-center justify-between shadow-inner cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.08)]"
              >
                <div className="flex items-center gap-3">
                  {/* Status Indicator (Win/Loss) */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md shrink-0 ${
                    rep.result === 'win'
                      ? 'bg-green-950/50 text-green-400 border border-green-800/30'
                      : 'bg-red-950/50 text-red-400 border border-red-900/30'
                  }`}>
                    {rep.result === 'win' ? '🏆' : '🤕'}
                  </div>

                  {/* Match Info */}
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-black italic text-xs uppercase leading-none">
                        {rep.playerCharName} VS {rep.opponentName}
                      </span>
                      <span className={`text-[8px] font-black px-1 rounded uppercase ${
                        rep.result === 'win'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {rep.result === 'win' ? 'KAZANDIN' : 'KAYBETTİN'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[9px] font-semibold text-zinc-500 mt-1.5">
                      <span className="flex items-center gap-1"><Trophy className="w-2.5 h-2.5 text-zinc-600" /> {rep.levelName}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5 text-zinc-600" /> {rep.date}</span>
                    </div>
                  </div>
                </div>

                {/* Right side Actions */}
                <div className="flex items-center gap-2">
                  <span className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-purple-400 uppercase tracking-wider italic pr-1 transition-all duration-300 hidden md:inline">
                    İZLE 🎥
                  </span>
                  <button
                    onClick={(e) => handleDeleteReplay(rep.id, e)}
                    className="p-1.5 bg-zinc-900/80 hover:bg-red-950/30 border border-zinc-800 hover:border-red-900/40 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                    title="Tekrarı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            playSFX('button_click');
            onClose();
          }}
          className="mt-4 w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white font-black text-xs uppercase italic rounded-xl border border-zinc-850 shrink-0 cursor-pointer"
        >
          MAÇ TEKRARLARINDAN ÇIK
        </button>
      </motion.div>
    </div>
  );
}
