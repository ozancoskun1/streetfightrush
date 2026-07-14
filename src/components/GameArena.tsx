import React, { useState, useEffect, useRef } from 'react';
import { Character, Opponent } from '../types';
import { getModifiedStats } from '../utils/gameData';
import { playSFX as originalPlaySFX } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Swords, Zap, Coins, Pause, Settings, Cpu, Smile, ChevronLeft, ChevronRight } from 'lucide-react';
import FighterSprite from './FighterSprite';
import fallbackArenaBg from '../assets/backgrounds/street_ring.png';

// Arena görselleri klasöre sonradan eklense bile otomatik bulunur.
// Eksik bir görsel varsa oyun bozulmaz; mevcut street_ring.png yedek olarak kullanılır.

const ARENA_BACKGROUND_FILES = {
  amateur: 'street_ring.png',
  street: 'street_arena.png',
  underground: 'yeralti.png',
  neon: 'neon_arena.png',
  colosseum: 'colosseum_arena.png'
} as const;

const findArenaBackground = (fileName: string) => {
  const matchedEntry = Object.entries(((import.meta as any).glob('../assets/backgrounds/*.{png,}',
      { eager: true, import: 'default' }) as Record<string, string>)).find(([path]) =>
    path.endsWith(`/${fileName}`)
  );

  return matchedEntry?.[1] ?? fallbackArenaBg;
};

interface GameArenaProps {
  player: Character;
  opponent: Opponent;
  onMatchFinished: (result: 'win' | 'lose', coinsEarned: number) => void;
  onExit: () => void;
  replayData?: any;
  isCampaignFight?: boolean;
}

interface DamageText {
  id: number;
  text: string;
  x: number; // percentage
  y: number; // offset
  type: 'damage' | 'heal' | 'block' | 'special';
}

// FighterVisual has been replaced by the modular FighterSprite component.

// Helper to save replay locally
function saveReplay(replay: {
  playerCharId: string;
  playerCharName: string;
  opponentId: number;
  opponentName: string;
  opponentAvatar: string;
  result: 'win' | 'lose';
  levelName: string;
  snapshots: any[];
  events: any[];
}) {
  try {
    const existing = localStorage.getItem('boxing_saved_replays');
    let replays: any[] = [];
    if (existing) {
      replays = JSON.parse(existing);
    }
    replays.unshift({
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toLocaleDateString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }),
      ...replay
    });
    if (replays.length > 8) {
      replays = replays.slice(0, 8);
    }
    localStorage.setItem('boxing_saved_replays', JSON.stringify(replays));
  } catch (e) {
    console.error('Failed to save replay', e);
  }
}

export default function GameArena({
  player,
  opponent,
  onMatchFinished,
  onExit,
  replayData,
  isCampaignFight
}: GameArenaProps) {
  const playerStats = getModifiedStats(player);

  // Rakibin kartta/VS ekranında görünen değerleri dövüşte de birebir kullan.
  // Zorluk artışı gameData/levelData içinde zaten hesaplandığı için burada tekrar çarpma yapmıyoruz.
  const scaledOpponentHealth = opponent.health;
  const scaledOpponentDamage = Math.max(1, opponent.damage);

  // Replay ekranında da doğru arena seçilebilsin.
  const isCampaignArena =
    isCampaignFight === true ||
    (typeof replayData?.levelName === 'string' && replayData.levelName.startsWith('Kampanya'));

  // Amatör mod ayrı arka plan kullanır. Kampanyada her 15 seviye bir arena değişir.
  const arenaConfig = (() => {
    if (!isCampaignArena) {
      return {
        name: 'AMATÖR ARENA',
        background: findArenaBackground(ARENA_BACKGROUND_FILES.amateur),
        backgroundPosition: 'center center',
        overlayClass: 'bg-black/20'
      };
    }

    if (opponent.id <= 15) {
      return {
        name: 'SOKAK',
        background: findArenaBackground(ARENA_BACKGROUND_FILES.street),
        backgroundPosition: 'center center',
        overlayClass: 'bg-black/25'
      };
    }

    if (opponent.id <= 30) {
      return {
        name: 'YERALTI',
        background: findArenaBackground(ARENA_BACKGROUND_FILES.underground),
        backgroundPosition: 'center center',
        overlayClass: 'bg-black/30'
      };
    }

    if (opponent.id <= 45) {
      return {
        name: 'NEON',
        background: findArenaBackground(ARENA_BACKGROUND_FILES.neon),
        backgroundPosition: 'center center',
        overlayClass: 'bg-black/20'
      };
    }

    return {
      name: 'KOLEZYUM',
      background: findArenaBackground(ARENA_BACKGROUND_FILES.colosseum),
      backgroundPosition: 'center center',
      overlayClass: 'bg-black/20'
    };
  })();

  // Core Game State
  const [playerHp, setPlayerHp] = useState(playerStats.health);
  const [opponentHp, setOpponentHp] = useState(scaledOpponentHealth);
  const [playerX, setPlayerX] = useState(25); // percentage (0-100)
  const [opponentX, setOpponentX] = useState(75); // percentage (0-100)

  // Pause & Action Panel State
  const [isPaused, setIsPaused] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 2000);
  };

  // Actions / State machines
  const [playerAction, setPlayerAction] = useState<'idle' | 'walk_left' | 'walk_right' | 'duck' | 'block' | 'punch' | 'heavy' | 'heavy_punch' | 'kick' | 'special' | 'hit' | 'ko'>('idle');
  const [opponentAction, setOpponentAction] = useState<'idle' | 'walk_left' | 'walk_right' | 'duck' | 'block' | 'punch' | 'heavy' | 'heavy_punch' | 'kick' | 'special' | 'hit' | 'ko'>('idle');

  // Skill cooldown track (timestamps)
  const [punchCdLeft, setPunchCdLeft] = useState(0);
  const [kickCdLeft, setKickCdLeft] = useState(0);
  const [specialCdLeft, setSpecialCdLeft] = useState(0);

  // Timers to reset animations
  const playerAnimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentAnimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Modern Arcade Visual Feedback Engine States ---
  interface Spark {
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    color: string;
  }

  interface CombatFeedbackItem {
    id: number;
    type: 'hit' | 'damage' | 'combo' | 'counter' | 'block';
    text: string;
    x: number;
    y: number;
    colorClass: string;
    customClass?: string;
  }

  const [feedbacks, setFeedbacks] = useState<CombatFeedbackItem[]>([]);
  const feedbackIdCounter = useRef(0);

  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparkIdCounter = useRef(0);

  const [playerCombo, setPlayerCombo] = useState(0);
  const [opponentCombo, setOpponentCombo] = useState(0);
  const playerComboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentComboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playerIsFlashing, setPlayerIsFlashing] = useState(false);
  const [opponentIsFlashing, setOpponentIsFlashing] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);

  // Key tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Match Status
  const [matchStatus, setMatchStatus] = useState<'ready' | 'fight' | 'finished'>('ready');
  const [matchResult, setMatchResult] = useState<'win' | 'lose' | null>(null);
  const [countdown, setCountdown] = useState<string | number>(3);

  // --- Fight Replay & Recording Engine States ---
  const isReplay = !!replayData;
  const [replayTime, setReplayTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [isReplayPaused, setIsReplayPaused] = useState(false);
  const [replayFinished, setReplayFinished] = useState(false);

  const recordingSnapshots = useRef<any[]>([]);
  const recordingEvents = useRef<any[]>([]);
  const fightStartTime = useRef<number>(0);

  const stateRef = useRef({ playerX, opponentX, playerHp, opponentHp, playerAction, opponentAction, playerIsFlashing, opponentIsFlashing, isScreenShaking });
  
  useEffect(() => {
    stateRef.current = { playerX, opponentX, playerHp, opponentHp, playerAction, opponentAction, playerIsFlashing, opponentIsFlashing, isScreenShaking };
  });

  // Intercept playSFX to record audio events
  const playSFX = (soundName: any) => {
    originalPlaySFX(soundName);
    if (matchStatus === 'fight' && !isReplay && fightStartTime.current) {
      const elapsed = Date.now() - fightStartTime.current;
      recordingEvents.current.push({
        t: elapsed,
        type: 'sound',
        data: soundName
      });
    }
  };

  // Constants
  const MIN_DISTANCE = 8; // Don't let them walk through each other
  const STRIKE_RANGE = 14; // Quick punch range
  const SPECIAL_RANGE = 18; // special punch range
  const GAME_PACE_SCALE = 0.65; // Make combat feel about 35% slower while staying responsive

  // Modern Feedback Triggers
  const triggerFeedback = (
    type: 'hit' | 'damage' | 'combo' | 'counter' | 'block',
    text: string,
    x: number,
    y: number,
    colorClass: string,
    customClass: string = ''
  ) => {
    const id = feedbackIdCounter.current++;
    setFeedbacks(prev => [...prev, { id, type, text, x, y, colorClass, customClass }]);
    setTimeout(() => {
      setFeedbacks(prev => prev.filter(item => item.id !== id));
    }, 750);

    // Record Event:
    if (matchStatus === 'fight' && !isReplay && fightStartTime.current) {
      const elapsed = Date.now() - fightStartTime.current;
      recordingEvents.current.push({
        t: elapsed,
        type: 'feedback',
        data: { type, text, x, y, colorClass, customClass }
      });
    }
  };

  const triggerImpactSparks = (x: number, y: number, color: string = '#f97316') => {
    const newSparks: Spark[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
      const dist = 30 + Math.random() * 40; // particle distance offset
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      newSparks.push({
        id: sparkIdCounter.current++,
        x,
        y,
        dx,
        dy,
        color
      });
    }
    setSparks(prev => [...prev, ...newSparks]);
    setTimeout(() => {
      const ids = newSparks.map(s => s.id);
      setSparks(prev => prev.filter(s => !ids.includes(s.id)));
    }, 500);

    // Record Event:
    if (matchStatus === 'fight' && !isReplay && fightStartTime.current) {
      const elapsed = Date.now() - fightStartTime.current;
      recordingEvents.current.push({
        t: elapsed,
        type: 'sparks',
        data: { x, y, color }
      });
    }
  };

  const registerHitEffects = (
    attacker: 'player' | 'opponent',
    type: 'light' | 'heavy' | 'kick' | 'special',
    damage: number,
    isBlocked: boolean,
    isEvaded: boolean
  ) => {
    const victim = attacker === 'player' ? 'opponent' : 'player';
    const victimX = victim === 'player' ? playerX : opponentX;
    
    // Impact position (centered between them with a small offset)
    const impactX = (playerX + opponentX) / 2;
    const impactY = 110 + Math.random() * 30; // height from floor in pixels

    if (isEvaded) {
      triggerFeedback('block', 'KAÇTI!', victimX, 150, 'text-amber-500 font-black italic text-lg md:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-float-up');
      triggerImpactSparks(impactX, impactY, '#cbd5e1'); // white sparks for escape
      return;
    }

    if (isBlocked) {
      triggerFeedback('block', `BLOK -${damage}`, victimX, 150, 'text-yellow-500 font-black italic text-lg md:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-float-up');
      triggerImpactSparks(impactX, impactY, '#fcd34d'); // golden sparks for blocks
      
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 120);

      if (victim === 'player') {
        setPlayerIsFlashing(true);
        setTimeout(() => setPlayerIsFlashing(false), 120);
      } else {
        setOpponentIsFlashing(true);
        setTimeout(() => setOpponentIsFlashing(false), 120);
      }
      return;
    }

    // --- GENUINE UNBLOCKED IMPACT ---
    
    // 1. Particle Sparks Burst
    let sparkColor = '#f97316'; // standard orange/yellow
    if (type === 'special') sparkColor = '#c084fc'; // purple
    if (type === 'heavy') sparkColor = '#f87171'; // soft crimson
    if (type === 'kick') sparkColor = '#fb923c'; // light orange
    triggerImpactSparks(impactX, impactY, sparkColor);

    // 2. Bright Fighter Flash
    if (victim === 'player') {
      setPlayerIsFlashing(true);
      setTimeout(() => setPlayerIsFlashing(false), 150);
    } else {
      setOpponentIsFlashing(true);
      setTimeout(() => setOpponentIsFlashing(false), 150);
    }

    // 3. Screen shake camera feedback
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), type === 'heavy' || type === 'special' ? 250 : 150);

    // 4. Counter Hit Detection
    let isCounter = false;
    if (attacker === 'player') {
      isCounter = opponentAction === 'punch' || opponentAction === 'heavy' || opponentAction === 'heavy_punch' || opponentAction === 'kick' || opponentAction === 'special';
    } else {
      isCounter = playerAction === 'punch' || playerAction === 'heavy' || playerAction === 'heavy_punch' || playerAction === 'kick' || playerAction === 'special';
    }

    if (isCounter) {
      triggerFeedback(
        'counter',
        'COUNTER!',
        impactX,
        impactY + 30,
        'text-cyan-400 font-black italic text-xl md:text-3xl drop-shadow-[0_4px_8px_rgba(6,182,212,0.8)] animate-pop-fade tracking-wide'
      );
    }

    // 5. Classic HIT Banner
    triggerFeedback(
      'hit',
      'HIT!',
      impactX,
      impactY,
      'text-yellow-400 font-black italic text-2xl md:text-4xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] animate-pop-fade tracking-wider'
    );

    // 6. Floating Damage Counter
    let damageColor = 'text-red-500';
    if (type === 'special') damageColor = 'text-purple-500';
    triggerFeedback(
      'damage',
      `-${damage}`,
      victimX,
      140,
      `${damageColor} font-mono font-black text-xl md:text-3.5xl drop-shadow-[0_3px_5px_rgba(0,0,0,0.95)] animate-float-up`
    );

    // 7. Dynamic Combo Trackers
    if (attacker === 'player') {
      if (playerComboTimer.current) clearTimeout(playerComboTimer.current);
      const nextCombo = playerCombo + 1;
      setPlayerCombo(nextCombo);
      setOpponentCombo(0); // reset rival's combo

      if (nextCombo > 1) {
        triggerFeedback(
          'combo',
          `${nextCombo} HIT COMBO!`,
          10,
          160,
          'text-yellow-300 font-black italic text-lg md:text-xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] animate-pop-fade bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-yellow-500/30 shadow-lg'
        );
      }

      playerComboTimer.current = setTimeout(() => {
        setPlayerCombo(0);
      }, 1600);
    } else {
      if (opponentComboTimer.current) clearTimeout(opponentComboTimer.current);
      const nextCombo = opponentCombo + 1;
      setOpponentCombo(nextCombo);
      setPlayerCombo(0); // break player's combo

      if (nextCombo > 1) {
        triggerFeedback(
          'combo',
          `${nextCombo} RAKİP COMBO!`,
          82,
          160,
          'text-red-400 font-black italic text-lg md:text-xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] animate-pop-fade bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-red-500/30 shadow-lg'
        );
      }

      opponentComboTimer.current = setTimeout(() => {
        setOpponentCombo(0);
      }, 1600);
    }
  };

  // Keep compatibility for direct popup requests (e.g. out-of-range ISKALA popup)
  const triggerDamagePopup = (text: string, x: number, type: 'damage' | 'heal' | 'block' | 'special') => {
    let colorClass = 'text-amber-500 font-black italic text-lg md:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-float-up';
    if (text === 'ISKALA') {
      colorClass = 'text-zinc-500 font-black italic text-lg md:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-float-up tracking-wider';
    }
    triggerFeedback('block', text, x, 145, colorClass);
  };

  // Countdown timer on entrance
  useEffect(() => {
    // Match intro sounds: bell first, then announcer/fight sound.
    playSFX('fight_bell');

    const fightStartSoundTimer = setTimeout(() => {
      playSFX('fight_start');
    }, 700);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (typeof prev === 'number') {
          if (prev === 1) {
            clearInterval(timer);
            setMatchStatus('fight');
            return 'DÖVÜŞ BAŞLASIN!';
          }
          return prev - 1;
        }
        return prev;
      });
    }, 1000);

    // Hide final countdown title
    setTimeout(() => {
      setCountdown('');
    }, 4000);

    return () => {
      clearInterval(timer);
      clearTimeout(fightStartSoundTimer);
    };
  }, []);

  // 1. Set fightStartTime on DÖVÜŞ BAŞLASIN!
  useEffect(() => {
    if (matchStatus === 'fight') {
      fightStartTime.current = Date.now();
    }
  }, [matchStatus]);

  // 2. Continuous high-fidelity recording loop (real fight mode)
  useEffect(() => {
    if (matchStatus !== 'fight' || isPaused || isReplay) return;

    const recordInterval = setInterval(() => {
      if (!fightStartTime.current) return;
      const elapsed = Date.now() - fightStartTime.current;
      const s = stateRef.current;
      recordingSnapshots.current.push({
        t: elapsed,
        pX: s.playerX,
        oX: s.opponentX,
        pHp: s.playerHp,
        oHp: s.opponentHp,
        pAct: s.playerAction,
        oAct: s.opponentAction,
        pF: s.playerIsFlashing,
        oF: s.opponentIsFlashing,
        sS: s.isScreenShaking
      });
    }, 80);

    return () => clearInterval(recordInterval);
  }, [matchStatus, isPaused, isReplay]);

  // 3. Replay playback delta timing loop (with speed multiplication and pause support)
  useEffect(() => {
    if (!isReplay || matchStatus !== 'fight' || isReplayPaused || replayFinished) return;

    let lastTick = Date.now();
    const interval = setInterval(() => {
      const delta = (Date.now() - lastTick) * playbackSpeed;
      lastTick = Date.now();
      setReplayTime(prev => {
        const next = prev + delta;
        const maxTime = replayData?.snapshots?.[replayData.snapshots.length - 1]?.t || 1;
        if (next >= maxTime) {
          setReplayFinished(true);
          return maxTime;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isReplay, matchStatus, isReplayPaused, playbackSpeed, replayFinished, replayData]);

  // 4. Seek state values dynamically at 'replayTime'
  useEffect(() => {
    if (!isReplay || !replayData?.snapshots) return;

    const t = replayTime;
    const snapshots = replayData.snapshots;

    let snapshot = snapshots[0];
    for (let i = 0; i < snapshots.length; i++) {
      if (snapshots[i].t <= t) {
        snapshot = snapshots[i];
      } else {
        break;
      }
    }

    if (snapshot) {
      setPlayerX(snapshot.pX);
      setOpponentX(snapshot.oX);
      setPlayerHp(snapshot.pHp);
      setOpponentHp(snapshot.oHp);
      setPlayerAction(snapshot.pAct);
      setOpponentAction(snapshot.oAct);
      setPlayerIsFlashing(snapshot.pF);
      setOpponentIsFlashing(snapshot.oF);
      setIsScreenShaking(snapshot.sS);
    }
  }, [isReplay, replayTime, replayData]);

  // 5. Playback visual & audio event dispatcher with retro-seeking check
  const lastTriggeredTime = useRef<number>(-1);

  useEffect(() => {
    if (!isReplay || !replayData?.events) return;

    const currentT = replayTime;
    const prevT = lastTriggeredTime.current;
    
    // Scrub backwards / Rewind support
    if (currentT < prevT) {
      lastTriggeredTime.current = currentT;
      return;
    }

    const events = replayData.events;
    events.forEach((ev: any) => {
      if (ev.t > prevT && ev.t <= currentT) {
        if (ev.type === 'sound') {
          originalPlaySFX(ev.data);
        } else if (ev.type === 'feedback') {
          const d = ev.data;
          triggerFeedback(d.type, d.text, d.x, d.y, d.colorClass, d.customClass);
        } else if (ev.type === 'sparks') {
          const d = ev.data;
          triggerImpactSparks(d.x, d.y, d.color);
        }
      }
    });

    lastTriggeredTime.current = currentT;
  }, [isReplay, replayTime, replayData]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchStatus !== 'fight' || isPaused || isReplay) return;
      keysPressed.current[e.key.toLowerCase()] = true;

      // Handle Instant triggers on key press
      if (e.key === 'j' || e.key === '1') handlePlayerPunch();
      if (e.key === 'u' || e.key === 'i' || e.key === '3') handlePlayerKick();
      if (e.key === 'l' || e.key === '4') handlePlayerSpecial();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [matchStatus, playerX, opponentX, playerAction, kickCdLeft, specialCdLeft, isPaused, isReplay]);

  // Game Loop: update movements & physics
  useEffect(() => {
    if (matchStatus !== 'fight' || isPaused || isReplay) return;

    const gameLoop = setInterval(() => {
      // 1. Move Player
      let nextPlayerX = playerX;
      let pAction = playerAction;

      if (
        playerAction !== 'punch' && 
        playerAction !== 'heavy' && 
        playerAction !== 'heavy_punch' && 
        playerAction !== 'kick' && 
        playerAction !== 'special' && 
        playerAction !== 'hit' && 
        playerAction !== 'ko'
      ) {
        if (keysPressed.current['s'] || keysPressed.current['arrowdown']) {
          pAction = 'duck';
        } else if (keysPressed.current['a'] || keysPressed.current['arrowleft']) {
          nextPlayerX = Math.max(5, playerX - playerStats.speed * 0.45 * GAME_PACE_SCALE);
          pAction = 'walk_left';
        } else if (keysPressed.current['d'] || keysPressed.current['arrowright']) {
          nextPlayerX = Math.min(95, playerX + playerStats.speed * 0.45 * GAME_PACE_SCALE);
          pAction = 'walk_right';
        } else {
          pAction = 'idle';
        }

        // Limit distance to opponent
        if (nextPlayerX > opponentX - MIN_DISTANCE) {
          nextPlayerX = opponentX - MIN_DISTANCE;
        }

        setPlayerX(nextPlayerX);
        setPlayerAction(pAction);
      }

      // 2. Cooldown timer updates
      setPunchCdLeft(prev => Math.max(0, prev - 0.05));
      setKickCdLeft(prev => Math.max(0, prev - 0.05));
      setSpecialCdLeft(prev => Math.max(0, prev - 0.05));

    }, 50);

    return () => clearInterval(gameLoop);
  }, [matchStatus, playerX, opponentX, playerAction, playerStats.speed, isPaused, isReplay]);

  // AI Opponent Loop - aggressive, mobile, defensive and combo-oriented behavior
  useEffect(() => {
    if (matchStatus !== 'fight' || isPaused || isReplay) return;

    const aiLoop = setInterval(() => {
      // Do not interrupt reactions, guard windows or attack animations already in progress.
      if (
        opponentAction === 'hit' ||
        opponentAction === 'ko' ||
        opponentAction === 'block' ||
        opponentAction === 'duck' ||
        opponentAction === 'punch' ||
        opponentAction === 'heavy' ||
        opponentAction === 'heavy_punch' ||
        opponentAction === 'kick' ||
        opponentAction === 'special'
      ) return;

      const dist = Math.abs(opponentX - playerX);
      const isPlayerGuarding = playerAction === 'duck' || playerAction === 'block';
      const isPlayerAttacking =
        playerAction === 'punch' ||
        playerAction === 'heavy' ||
        playerAction === 'heavy_punch' ||
        playerAction === 'kick' ||
        playerAction === 'special';

      // Difficulty scales with opponent level without making early opponents impossible.
      const difficulty = Math.min(1, opponent.id / 15);
      const closeAttackChance = Math.min(0.94, 0.72 + difficulty * 0.20);
      const midKickChance = Math.min(0.90, 0.58 + difficulty * 0.28);
      const reactiveGuardChance = Math.min(0.72, 0.30 + difficulty * 0.34);
      const neutralGuardChance = Math.min(0.24, 0.08 + difficulty * 0.12);
      const randomVal = Math.random();

      // 1) React to the player's attack: higher-level opponents guard much more often.
      if (dist <= 20 && isPlayerAttacking && Math.random() < reactiveGuardChance) {
        setOpponentActionWithTimer('block', 320 + Math.floor(Math.random() * 240));

        // Small defensive step back while guarding so the AI feels alive.
        if (Math.random() < 0.45) {
          setOpponentX(prev => Math.min(95, prev + (1.2 + difficulty * 1.8)));
        }
        return;
      }

      // 2) Far range: continuously move toward the player. No idle waiting.
      if (dist > 22) {
        setOpponentAction('walk_left');
        setOpponentX(prev => Math.max(
          playerX + MIN_DISTANCE,
          prev - opponent.speed * (0.55 + difficulty * 0.12) * GAME_PACE_SCALE
        ));
        return;
      }

      // 3) Mid range: mix forward pressure, kicks and brief guard windows.
      if (dist > STRIKE_RANGE) {
        if (randomVal < midKickChance) {
          handleOpponentKick();
        } else if (randomVal < midKickChance + neutralGuardChance) {
          setOpponentActionWithTimer('block', 280 + Math.floor(Math.random() * 220));
        } else {
          setOpponentAction('walk_left');
          setOpponentX(prev => Math.max(
            playerX + MIN_DISTANCE,
            prev - opponent.speed * 0.50 * GAME_PACE_SCALE
          ));
        }
        return;
      }

      // 4) Close range: pressure with attacks, but also weave movement and guard.
      if (randomVal < closeAttackChance) {
        const attackType = Math.random();

        if (attackType < 0.14 && opponent.id >= 3) {
          handleOpponentSpecial();
        } else if (attackType < 0.34) {
          handleOpponentKick();
        } else if (attackType < 0.58 && opponent.id >= 2) {
          handleOpponentHeavyPunch();
        } else {
          handleOpponentPunch();
        }
        return;
      }

      // 5) When the player turtles, reposition instead of standing still.
      if (isPlayerGuarding && Math.random() < 0.55) {
        if (Math.random() < 0.55) {
          setOpponentAction('walk_right');
          setOpponentX(prev => Math.min(95, prev + opponent.speed * 0.28 * GAME_PACE_SCALE));
        } else {
          setOpponentActionWithTimer('block', 300 + Math.floor(Math.random() * 220));
        }
        return;
      }

      // 6) Neutral close-range footwork: step in/out constantly instead of idling.
      if (Math.random() < 0.50) {
        setOpponentAction('walk_right');
        setOpponentX(prev => Math.min(95, prev + opponent.speed * 0.24 * GAME_PACE_SCALE));
      } else if (Math.random() < neutralGuardChance + 0.18) {
        setOpponentActionWithTimer('block', 260 + Math.floor(Math.random() * 220));
      } else {
        setOpponentAction('walk_left');
        setOpponentX(prev => Math.max(
          playerX + MIN_DISTANCE,
          prev - opponent.speed * 0.22 * GAME_PACE_SCALE
        ));
      }

    }, Math.max(170, 330 - opponent.id * 10)); // Later opponents think and react faster.

    return () => clearInterval(aiLoop);
  }, [matchStatus, playerX, opponentX, opponentAction, playerAction, opponent.id, opponent.speed, isPaused, isReplay]);

  // Match over observer
  useEffect(() => {
    if (playerHp <= 0 && matchStatus === 'fight') {
      handleMatchEnd('lose');
    } else if (opponentHp <= 0 && matchStatus === 'fight') {
      handleMatchEnd('win');
    }
  }, [playerHp, opponentHp, matchStatus]);

  const handleMatchEnd = (outcome: 'win' | 'lose') => {
    setMatchStatus('finished');
    setMatchResult(outcome);
    
    if (outcome === 'win') {
      playSFX('match_win');
      setOpponentAction('ko');
      setPlayerAction('idle');
    } else {
      playSFX('match_lose');
      playSFX('knockout');
      setPlayerAction('ko');
    }

    if (!isReplay) {
      saveReplay({
        playerCharId: player.id,
        playerCharName: player.name,
        opponentId: opponent.id,
        opponentName: opponent.name,
        opponentAvatar: opponent.avatar,
        result: outcome,
        levelName: isCampaignFight ? `Kampanya Seviye ${opponent.id}` : `Amatör Seviye ${opponent.id}`,
        snapshots: recordingSnapshots.current,
        events: recordingEvents.current
      });
    }
  };

  // Trigger animations helpers
  const setPlayerActionWithTimer = (act: typeof playerAction, ms: number) => {
    if (playerAnimTimer.current) clearTimeout(playerAnimTimer.current);
    setPlayerAction(act);
    playerAnimTimer.current = setTimeout(() => {
      setPlayerAction('idle');
    }, ms);
  };

  const setOpponentActionWithTimer = (act: typeof opponentAction, ms: number) => {
    if (opponentAnimTimer.current) clearTimeout(opponentAnimTimer.current);
    setOpponentAction(act);
    opponentAnimTimer.current = setTimeout(() => {
      setOpponentAction('idle');
    }, ms);
  };

  // Attacks: Player Quick Punch
  const handlePlayerPunch = () => {
  if (punchCdLeft > 0) return;

  if (
    playerAction === 'punch' ||
    playerAction === 'heavy' ||
    playerAction === 'heavy_punch' ||
    playerAction === 'kick' ||
    playerAction === 'special' ||
    playerAction === 'ko' ||
    playerAction === 'hit'
  ) return;

  setPlayerActionWithTimer('punch', 200);
  setPunchCdLeft(0.25);
  playSFX('punch_light');

  const dist = Math.abs(playerX - opponentX);
  const punchRangePct = (playerStats.punchRange || 75) / 5;

  if (dist <= punchRangePct) {
    applyDamageToOpponent(playerStats.punchDamage, 'light');
  } else {
    triggerDamagePopup('ISKALA', opponentX, 'block');
  }
};

  // Attacks: Player Kick (Martial Arts style, slides slightly forward!)
  const handlePlayerKick = () => {
    if (kickCdLeft > 0) return;
    if (playerAction === 'punch' || playerAction === 'heavy' || playerAction === 'heavy_punch' || playerAction === 'kick' || playerAction === 'special' || playerAction === 'ko' || playerAction === 'hit') return;

    // Slide forward towards opponent
    const slideDist = 6;
    setPlayerX(prev => Math.min(opponentX - MIN_DISTANCE, prev + slideDist));

    setPlayerActionWithTimer('kick', 250);
    setKickCdLeft(playerStats.kickCooldown * (1 / GAME_PACE_SCALE));
    playSFX('punch_heavy');

    const dist = Math.abs(playerX - opponentX) - slideDist; // adjusted distance after slide
    const kickRangePct = (playerStats.kickRange || 105) / 5; // e.g., 21%
    if (dist <= kickRangePct) {
      applyDamageToOpponent(playerStats.kickDamage, 'kick');
    } else {
      triggerDamagePopup('ISKALA', opponentX, 'block');
    }
  };

  // Attacks: Player Special Throw Strike
  const handlePlayerSpecial = () => {
    if (specialCdLeft > 0) return;
    if (playerAction === 'punch' || playerAction === 'heavy' || playerAction === 'heavy_punch' || playerAction === 'kick' || playerAction === 'special' || playerAction === 'ko' || playerAction === 'hit') return;

    setPlayerActionWithTimer('special', 400);
    setSpecialCdLeft(playerStats.throwCooldown * (1 / GAME_PACE_SCALE));
    playSFX('throw_attack');

    const dist = Math.abs(playerX - opponentX);
    if (dist <= SPECIAL_RANGE) {
      applyDamageToOpponent(playerStats.throwDamage, 'special');
      // Push opponent back!
      setOpponentX(prev => Math.min(95, prev + 15));
    } else {
      triggerDamagePopup('ISKALA', opponentX, 'block');
    }
  };

  // Apply Damage calculation with Duck/Guard defense check
  const applyDamageToOpponent = (dmg: number, type: 'light' | 'heavy' | 'kick' | 'special') => {
    const isDucking = opponentAction === 'duck' || opponentAction === 'block';
    let finalDmg = dmg;

    if (isDucking) {
      // Eğilme/Duck bazı yumruklardan kaçırtsın (%80 kaçma şansı)
      if ((type === 'light' || type === 'heavy') && Math.random() < 0.8) {
        registerHitEffects('player', type, 0, false, true); // Evaded/Kaçtı!
        playSFX('guard_block');
        return;
      }

      // Guard açıkken gelen hasar %50 azalsın (veya rakibin id'sine göre)
      const reduction = opponent.id === 4 ? 0.70 : 0.50; // Tank has higher reduction
      finalDmg = Math.max(1, Math.floor(dmg * (1 - reduction)));
      setOpponentHp(prev => Math.max(0, prev - finalDmg));
      registerHitEffects('player', type, finalDmg, true, false); // Blocked
      playSFX('guard_block');
    } else {
      setOpponentHp(prev => Math.max(0, prev - finalDmg));
      registerHitEffects('player', type, finalDmg, false, false); // Hit!
      playSFX('hit_body');
      
      // Flash hit reaction
      setOpponentActionWithTimer('hit', 200);
    }
  };

  // AI Actions: Opponent Punch
  const handleOpponentPunch = () => {
    setOpponentActionWithTimer('punch', 200);
    playSFX('punch_light');

    const dist = Math.abs(opponentX - playerX);
    if (dist <= STRIKE_RANGE) {
      applyDamageToPlayer(scaledOpponentDamage, 'light');
    }
  };

  // AI Actions: Opponent Heavy
  const handleOpponentHeavyPunch = () => {
    setOpponentActionWithTimer('heavy', 300);
    playSFX('punch_heavy');

    const dist = Math.abs(opponentX - playerX);
    if (dist <= STRIKE_RANGE) {
      applyDamageToPlayer(Math.floor(scaledOpponentDamage * 1.6), 'heavy');
    }
  };

  // AI Actions: Opponent Kick (slides forward!)
  const handleOpponentKick = () => {
    const slideDist = 5;
    setOpponentX(prev => Math.max(playerX + MIN_DISTANCE, prev - slideDist));

    setOpponentActionWithTimer('kick', 250);
    playSFX('punch_heavy');

    const dist = Math.abs(opponentX - playerX) - slideDist;
    const opponentKickRangePct = 18;
    if (dist <= opponentKickRangePct) {
      applyDamageToPlayer(Math.floor(scaledOpponentDamage * 1.25), 'kick');
    }
  };

  // AI Actions: Opponent Special
  const handleOpponentSpecial = () => {
    setOpponentActionWithTimer('special', 400);
    playSFX('throw_attack');

    const dist = Math.abs(opponentX - playerX);
    if (dist <= SPECIAL_RANGE) {
      applyDamageToPlayer(Math.floor(scaledOpponentDamage * 2.2), 'special');
      // Push player back
      setPlayerX(prev => Math.max(5, prev - 12));
    }
  };

  const applyDamageToPlayer = (dmg: number, type: 'light' | 'heavy' | 'kick' | 'special') => {
    const isDucking = playerAction === 'duck' || playerAction === 'block';
    let finalDmg = dmg;

    if (isDucking) {
      // Eğilme bazı yumruklardan kaçırtsın (%80 kaçma şansı)
      if ((type === 'light' || type === 'heavy') && Math.random() < 0.8) {
        registerHitEffects('opponent', type, 0, false, true); // Evaded/Kaçtı!
        playSFX('guard_block');
        return;
      }

      // Guard açıkken gelen hasar %50 azalsın (veya boksörün guardReduction değeri kadar azalsın)
      const reduction = playerStats.guardReduction || 0.50;
      finalDmg = Math.max(1, Math.floor(dmg * (1 - reduction)));
      setPlayerHp(prev => Math.max(0, prev - finalDmg));
      registerHitEffects('opponent', type, finalDmg, true, false); // Blocked
      playSFX('guard_block');
    } else {
      setPlayerHp(prev => Math.max(0, prev - finalDmg));
      registerHitEffects('opponent', type, finalDmg, false, false); // Hit!
      playSFX('hit_body');
      setPlayerActionWithTimer('hit', 200);
    }
  };

  // Calculate Coin earnings on victory
  const getCoinsEarned = () => {
    return 40 + opponent.id * 15;
  };

  return (
    <div className="absolute inset-0 bg-zinc-950 font-sans select-none overflow-hidden flex flex-col justify-between">
      
      {/* 1. TOP HEALTH BAR HUD */}
      <div className="absolute top-3 left-0 right-0 px-4 flex items-center justify-between z-20 pointer-events-none">
        {/* Player Status */}
        <div className="flex-1 max-w-[40%] flex items-center gap-2">
          <div className="hidden">
            🥊
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between text-xs font-black text-white uppercase leading-none mb-1 italic drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
              <span>{player.name}</span>
              <span className="font-mono text-orange-500">{playerHp} / {playerStats.health}</span>
            </div>
            {/* Health bar container */}
             <div className="w-full h-2.5 overflow-hidden relative">
              <motion.div 
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full"
                animate={{ width: `${(playerHp / playerStats.health) * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        </div>

        {/* VS Indicator */}
        <div className="px-4 py-1 flex flex-col items-center">
          <span className="text-orange-500 font-black text-sm tracking-widest italic animate-pulse">VS</span>
          <span className="text-zinc-400 text-[8px] font-mono uppercase tracking-wider">{arenaConfig.name} · ROUND 1</span>
        </div>

        {/* Opponent Status */}
        <div className="flex-1 max-w-[40%] flex items-center gap-2 flex-row-reverse">
          <div className="hidden">
            {opponent.avatar}
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between flex-row-reverse text-xs font-black text-white uppercase leading-none mb-1 italic drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
              <span>{opponent.name}</span>
              <span className="font-mono text-red-500">{opponentHp} / {scaledOpponentHealth}</span>
            </div>
            {/* Health bar container */}
            <div className="w-full h-2.5 overflow-hidden relative">
              <motion.div 
                className="bg-gradient-to-r from-red-600 to-rose-500 h-full"
                animate={{ width: `${(opponentHp / scaledOpponentHealth) * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE RING ARENA PLAYGROUND */}
      <div
        className={`flex-1 relative overflow-hidden flex items-end justify-center ${isScreenShaking ? 'animate-shake' : ''}`}
        style={{
          backgroundImage: `url(${arenaConfig.background})`,
          backgroundSize: 'cover',
          backgroundPosition: arenaConfig.backgroundPosition,
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className={`absolute inset-0 ${arenaConfig.overlayClass} z-0`} />

        {/* Dynamic Float Combat Feedbacks */}
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
          {feedbacks.map(f => (
            <div
              key={f.id}
              className={`absolute pointer-events-none select-none ${f.colorClass} ${f.customClass || ''}`}
              style={{
                left: `${f.x}%`,
                bottom: `${f.y}px`,
                transform: 'translateX(-50%)',
              }}
            >
              {f.text}
            </div>
          ))}
        </div>

        {/* Red/Orange/Purple particle impact splash sparks */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
          {sparks.map(s => (
            <div
              key={s.id}
              className="absolute w-2 h-2 rounded-full animate-spark"
              style={{
                left: `${s.x}%`,
                bottom: `${s.y}px`,
                backgroundColor: s.color,
                boxShadow: `0 0 10px ${s.color}`,
                '--tw-spark-x': `${s.dx}px`,
                '--tw-spark-y': `${s.dy}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* PLAYERS SPATIAL CANVAS ROW */}
        <div className="w-full h-48 absolute bottom-8 left-0 right-0 pointer-events-none">
          
          {/* PLAYER FIGHTER */}
          <div 
            className="absolute bottom-0 h-36 w-24 transition-all duration-75 ease-out flex flex-col items-center justify-end"
            style={{ left: `${playerX}%`, transform: 'translateX(-50%)' }}
          >
            {/* Visual Indicator of player */}
        

            {/* Fighter Figure Body Wrapper */}
            <div className="relative">
              <FighterSprite 
                characterId={player.id}
                name={player.name}
                action={playerAction as any}
                color={player.color}
                accentColor={player.accentColor}
                isPlayer={true}
                isFlashing={playerIsFlashing}
              />
            </div>
          </div>

          {/* AI OPPONENT FIGHTER */}
          <div 
            className="absolute bottom-0 h-36 w-24 transition-all duration-75 ease-out flex flex-col items-center justify-end"
            style={{ left: `${opponentX}%`, transform: 'translateX(-50%)' }}
          >
            {/* Visual Indicator */}
           

            {/* Fighter Body Wrapper */}
            <div className="relative">
              <FighterSprite 
                characterId={opponent.characterId || 'rookie'}
                name={opponent.name}
                action={opponentAction as any}
                color={opponent.color}
                accentColor={opponent.accentColor}
                isPlayer={false}
                isFlashing={opponentIsFlashing}
              />
            </div>
          </div>

        </div>
      </div>

      {/* 3. GAME STATE MODALS (Entrance Countdown, Victory, Defeat) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#161616] border border-orange-500/50 text-orange-400 font-extrabold text-xs uppercase px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}

        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 z-40 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-xs bg-zinc-900 border-2 border-orange-500 rounded-[32px] p-6 text-center shadow-2xl flex flex-col gap-5 relative overflow-hidden"
            >
              <div>
                <span className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1 text-orange-500 font-black text-[10px] uppercase tracking-wider">
                  OYUN DURDURULDU
                </span>
                <h2 className="text-white font-black text-2xl uppercase tracking-tight mt-3 italic font-sans">MOLA ZAMANI!</h2>
              </div>

              <div className="text-5xl my-2">⏸️</div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setIsPaused(false)}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-sm uppercase italic rounded-xl border-b-4 border-orange-850 active:border-b-0 transition-all cursor-pointer shadow-md"
                >
                  DEVAM ET
                </button>
                <button
                  onClick={onExit}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 active:scale-95 text-zinc-400 font-black text-xs uppercase italic rounded-xl border border-zinc-950 transition-all cursor-pointer"
                >
                  MAÇTAN ÇIK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {countdown && (
          <motion.div 
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 pointer-events-none"
          >
            <span className="text-orange-500 font-black text-5xl md:text-8xl uppercase italic tracking-wider drop-shadow-[0_4px_8px_rgba(0,0,0,1)] animate-bounce">
              {countdown}
            </span>
          </motion.div>
        )}

        {matchStatus === 'finished' && matchResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/90 z-40 flex items-center justify-center p-4"
          >
            {isReplay ? (
              /* REPLAY COMPLETED OVERLAY PANEL */
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-sm bg-zinc-950 border-4 border-purple-500 rounded-[32px] p-6 text-center shadow-[0_20px_50px_rgba(168,85,247,0.35)] flex flex-col gap-5 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(168,85,247,1)_1px,_transparent_1px)] bg-[size:100%_4px]" />

                <div>
                  <span className="bg-purple-500/20 text-purple-400 font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-wider italic border border-purple-500/30">
                    TEKRAR TAMAMLANDI
                  </span>
                  <h2 className="text-white font-black text-2xl uppercase tracking-tight mt-3 italic">MAÇ SONUCU: {matchResult === 'win' ? 'GALİBİYET' : 'MAĞLUBİYET'}</h2>
                </div>

                <div className="text-6xl my-2">📺</div>

                <p className="text-zinc-400 text-xs leading-relaxed px-4">
                  Dövüş tekrarı başarıyla tamamlandı. Aşağıdaki butonları kullanarak tekrarı baştan izleyebilir veya ana menüye dönebilirsiniz.
                </p>

                <div className="flex flex-col gap-2 mt-2 relative z-10">
                  <button
                    onClick={() => {
                      setReplayTime(0);
                      setReplayFinished(false);
                      setIsReplayPaused(false);
                      setMatchStatus('fight');
                      originalPlaySFX('button_click');
                    }}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-black text-sm uppercase italic rounded-2xl transition-all shadow-lg cursor-pointer"
                  >
                    🔁 BAŞTAN İZLE
                  </button>
                  <button
                    onClick={onExit}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-400 font-black text-xs uppercase italic rounded-2xl border border-zinc-800 transition-all cursor-pointer"
                  >
                    👋 TEKRARDAN ÇIK
                  </button>
                </div>
              </motion.div>
            ) : matchResult === 'win' ? (
              /* MATCH WON PANEL - COMPACT LANDSCAPE RECTANGLE */
              <motion.div
                initial={{ scale: 0.92, y: 18, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 18, opacity: 0 }}
                className="
                  relative w-[94vw] max-w-[760px] max-h-[82vh]
                  overflow-hidden rounded-[22px]
                  border-2 border-white/80
                  bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-950
                  shadow-[0_20px_60px_rgba(59,130,246,0.38)]
                "
              >
                <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
                <div className="absolute -left-16 -top-16 w-44 h-44 rounded-full bg-fuchsia-400/20 blur-3xl pointer-events-none" />
                <div className="absolute -right-16 -bottom-16 w-44 h-44 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

                <div className="relative z-10 grid grid-cols-[0.9fr_1.1fr] gap-3 p-3 sm:p-4">
                  {/* SOL: SONUÇ */}
                  <div className="min-w-0 flex flex-col items-center justify-center text-center rounded-2xl border border-white/15 bg-black/15 px-3 py-2.5">
                    <span className="rounded-lg bg-white px-2.5 py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-wider italic text-purple-700">
                      NAKAVT! MAÇI KAZANDIN
                    </span>

                    <div className="text-4xl sm:text-5xl mt-1 leading-none drop-shadow-xl">
                      🏆
                    </div>

                    <h2 className="mt-1 text-base sm:text-xl font-black uppercase italic leading-tight text-white">
                      Tebrikler Şampiyon!
                    </h2>

                    <p className="mt-1 max-w-[250px] text-[9px] sm:text-[10px] leading-snug text-blue-100/75">
                      {opponent.name} mağlup edildi. Ödülünü al ve sıradaki mücadeleye geç.
                    </p>
                  </div>

                  {/* SAĞ: ÖDÜL VE BUTONLAR */}
                  <div className="min-w-0 flex flex-col justify-between gap-2.5">
                    <div className="rounded-2xl border border-white/15 bg-black/25 p-2.5 sm:p-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.14em] italic text-purple-100">
                          Kazanılan Ödüller
                        </span>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-2.5 py-2">
                          <span className="block text-[7px] font-black uppercase tracking-wider text-yellow-100/65">
                            Altın
                          </span>
                          <div className="mt-1 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-yellow-300" />
                            <span className="font-mono text-sm sm:text-base font-black text-yellow-300">
                              +{getCoinsEarned()}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-2">
                          <span className="block text-[7px] font-black uppercase tracking-wider text-emerald-100/65">
                            Maç Bonusu
                          </span>
                          <div className="mt-1 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-emerald-300" />
                            <span className="text-[9px] sm:text-[10px] font-black uppercase italic text-emerald-300">
                              Kazanıldı
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          originalPlaySFX('button_click');
                          onMatchFinished('win', getCoinsEarned());
                        }}
                        className="
                          min-w-0 rounded-xl border-b-[3px] border-zinc-300
                          bg-white px-2 py-2.5
                          text-[9px] sm:text-[10px] font-black uppercase italic leading-tight
                          text-purple-700 shadow-lg transition-all
                          active:scale-[0.97] active:border-b-0 cursor-pointer
                        "
                      >
                        {isCampaignFight ? 'DİĞER BÖLÜME GEÇ' : 'SONRAKİ RAKİBE GEÇ'}
                      </button>

                      <button
                        onClick={() => {
                          originalPlaySFX('button_click');
                          onExit();
                        }}
                        className="
                          min-w-0 rounded-xl border border-white/15
                          bg-black/30 px-2 py-2.5
                          text-[9px] sm:text-[10px] font-black uppercase italic
                          text-white transition-all
                          active:scale-[0.97] cursor-pointer
                        "
                      >
                        ANA MENÜ
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* MATCH LOST PANEL - COMPACT LANDSCAPE RECTANGLE */
              <motion.div
                initial={{ scale: 0.92, y: 18, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 18, opacity: 0 }}
                className="
                  relative w-[94vw] max-w-[760px] max-h-[82vh]
                  overflow-hidden rounded-[22px]
                  border-2 border-red-500/65
                  bg-gradient-to-br from-zinc-950 via-[#190f0f] to-red-950
                  shadow-[0_20px_60px_rgba(220,38,38,0.34)]
                "
              >
                <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
                <div className="absolute -left-16 -top-16 w-44 h-44 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
                <div className="absolute -right-16 -bottom-16 w-44 h-44 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 grid grid-cols-[0.9fr_1.1fr] gap-3 p-3 sm:p-4">
                  {/* SOL: MAĞLUBİYET */}
                  <div className="min-w-0 flex flex-col items-center justify-center text-center rounded-2xl border border-red-500/20 bg-black/25 px-3 py-2.5">
                    <span className="rounded-lg bg-red-600 px-2.5 py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-wider italic text-white">
                      NAKAVT EDİLDİN
                    </span>

                    <div className="text-4xl sm:text-5xl mt-1 leading-none drop-shadow-xl">
                      🤕
                    </div>

                    <h2 className="mt-1 text-base sm:text-xl font-black uppercase italic leading-tight text-white">
                      Mücadele Bitmedi!
                    </h2>

                    <p className="mt-1 max-w-[250px] text-[9px] sm:text-[10px] leading-snug text-zinc-400">
                      <span className="font-black text-red-400">{opponent.name}</span>{' '}
                      seni mağlup etti. Dövüşçünü geliştirip tekrar dene.
                    </p>
                  </div>

                  {/* SAĞ: ÖZET VE BUTONLAR */}
                  <div className="min-w-0 flex flex-col justify-between gap-2.5">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-2.5 sm:p-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.14em] italic text-red-200">
                          Maç Sonucu
                        </span>
                        <Shield className="w-3.5 h-3.5 text-red-400" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-2.5 py-2">
                          <span className="block text-[7px] font-black uppercase tracking-wider text-red-200/60">
                            Rakip
                          </span>
                          <span className="mt-1 block truncate text-[9px] sm:text-[10px] font-black uppercase italic text-white">
                            {opponent.name}
                          </span>
                        </div>

                        <div className="rounded-xl border border-zinc-600/20 bg-white/5 px-2.5 py-2">
                          <span className="block text-[7px] font-black uppercase tracking-wider text-zinc-500">
                            Durum
                          </span>
                          <span className="mt-1 block text-[9px] sm:text-[10px] font-black uppercase italic text-red-400">
                            Mağlubiyet
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-orange-500/15 bg-orange-500/5 px-2.5 py-1.5">
                        <Zap className="w-3.5 h-3.5 shrink-0 text-orange-400" />
                        <p className="text-[8px] sm:text-[9px] leading-snug text-zinc-400">
                          Can ve saldırı seviyelerini yükselterek tekrar dene.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          originalPlaySFX('button_click');
                          onMatchFinished('lose', 0);
                        }}
                        className="
                          min-w-0 rounded-xl border-b-[3px] border-red-950
                          bg-gradient-to-r from-red-600 to-orange-600 px-2 py-2.5
                          text-[9px] sm:text-[10px] font-black uppercase italic
                          text-white shadow-lg transition-all
                          active:scale-[0.97] active:border-b-0 cursor-pointer
                        "
                      >
                        TEKRAR OYNA
                      </button>

                      <button
                        onClick={() => {
                          originalPlaySFX('button_click');
                          onExit();
                        }}
                        className="
                          min-w-0 rounded-xl border border-white/10
                          bg-white/5 px-2 py-2.5
                          text-[9px] sm:text-[10px] font-black uppercase italic
                          text-zinc-300 transition-all
                          active:scale-[0.97] cursor-pointer
                        "
                      >
                        ANA MENÜ
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. FLOATING MOBILE LEGENDS STYLE CONTROLS */}
      {isReplay ? (
        <div className="absolute left-4 right-4 bottom-4 z-30 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-md px-4 py-3 shadow-2xl">
          <div className="w-full flex flex-col justify-center gap-2 h-full py-1">
            {/* Timeline track */}
            <div className="flex items-center gap-3 w-full px-2">
              <span className="text-zinc-300 font-mono font-black text-xs min-w-[35px] text-right">
                {(() => {
                  const secs = Math.floor(replayTime / 1000);
                  const m = Math.floor(secs / 60);
                  const s = secs % 60;
                  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                })()}
              </span>
              <input 
                type="range"
                min="0"
                max={replayData?.snapshots?.[replayData.snapshots.length - 1]?.t || 1000}
                value={replayTime}
                onChange={(e) => {
                  setReplayTime(Number(e.target.value));
                  setReplayFinished(false);
                }}
                className="flex-1 accent-purple-500 h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer border border-white/10"
              />
              <span className="text-zinc-300 font-mono font-black text-xs min-w-[35px] text-left">
                {(() => {
                  const totalMs = replayData?.snapshots?.[replayData.snapshots.length - 1]?.t || 1000;
                  const secs = Math.floor(totalMs / 1000);
                  const m = Math.floor(secs / 60);
                  const s = secs % 60;
                  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                })()}
              </span>
            </div>

            {/* Replay Controls Row */}
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 ${isReplayPaused ? 'hidden' : ''}`} />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
                </span>
                <span className="text-purple-300 font-black text-[10px] uppercase tracking-widest italic leading-none">
                  TEKRAR MODU {replayFinished && '(BİTTİ)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsReplayPaused(!isReplayPaused);
                    originalPlaySFX('button_click');
                  }}
                  className="px-4 py-1.5 bg-white/10 border border-white/15 hover:bg-white/15 text-white font-black text-[11px] uppercase italic rounded-xl flex items-center gap-1 transition cursor-pointer"
                >
                  {isReplayPaused ? 'BAŞLAT ▶' : 'DURDUR ⏸'}
                </button>

                <button
                  onClick={() => {
                    setPlaybackSpeed(prev => prev === 1 ? 2 : prev === 2 ? 4 : 1);
                    originalPlaySFX('button_click');
                  }}
                  className="px-3 py-1.5 bg-white/10 border border-white/15 text-white font-mono font-black text-[11px] rounded-xl flex items-center justify-center min-w-[45px] transition cursor-pointer"
                >
                  {playbackSpeed}X HIZ
                </button>

                <button
                  onClick={() => {
                    setReplayTime(0);
                    setReplayFinished(false);
                    setIsReplayPaused(false);
                    originalPlaySFX('button_click');
                  }}
                  className="px-3 py-1.5 bg-white/10 border border-white/15 text-white hover:bg-white/15 text-[11px] font-black uppercase rounded-xl transition cursor-pointer"
                  title="Yeniden Başlat"
                >
                  🔁 SIFIRLA
                </button>
              </div>

              <button
                onClick={() => {
                  originalPlaySFX('button_click');
                  onExit();
                }}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-red-300 font-black text-[11px] uppercase italic rounded-xl flex items-center gap-1 transition cursor-pointer"
              >
                TEKRARDAN ÇIK 👋
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-30 pointer-events-none select-none">
          {/* Small pause button */}
          <button
            onClick={() => {
              setIsPaused(true);
              playSFX('button_click');
            }}
            className="pointer-events-auto absolute left-4 top-24 w-11 h-11 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-white shadow-[0_8px_25px_rgba(0,0,0,0.35)] active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            title="Oyunu Durdur"
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>

          {/* LEFT: modern movement pad */}
          <div className="pointer-events-auto absolute left-3 bottom-3 touch-none">
            <div className="relative flex items-center gap-2 rounded-[30px] border border-white/15 bg-zinc-950/[0.55] p-2 shadow-[0_16px_45px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
              {/* Soft orange ambient glow */}
              <div className="pointer-events-none absolute inset-x-5 -bottom-2 h-8 rounded-full bg-orange-500/20 blur-2xl" />

              {/* Compact label */}
             

              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  keysPressed.current['a'] = true;
                  keysPressed.current['arrowleft'] = true;
                }}
                onPointerUp={(e) => {
                  keysPressed.current['a'] = false;
                  keysPressed.current['arrowleft'] = false;
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                }}
                onPointerCancel={() => {
                  keysPressed.current['a'] = false;
                  keysPressed.current['arrowleft'] = false;
                }}
                className="group relative flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[24px] border border-white/15 bg-gradient-to-br from-white/[0.14] to-white/[0.04] text-white shadow-[0_10px_24px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-150 active:scale-[0.91] active:border-orange-400/70 active:bg-orange-500/20 active:shadow-[0_0_28px_rgba(249,115,22,0.35),inset_0_0_24px_rgba(249,115,22,0.18)] cursor-pointer touch-none"
                title="Sola Git"
                aria-label="Sola git"
              >
                <div className="absolute inset-2 rounded-[18px] border border-white/[0.06] bg-black/10" />
                <ChevronLeft className="relative z-10 h-11 w-11 stroke-[3.2] text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.28)] transition-transform duration-150 group-active:-translate-x-1 group-active:text-orange-200" />
                <span className="absolute bottom-2 text-[7px] font-black uppercase tracking-[0.2em] text-white/25">LEFT</span>
              </button>

              <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />

              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  keysPressed.current['d'] = true;
                  keysPressed.current['arrowright'] = true;
                }}
                onPointerUp={(e) => {
                  keysPressed.current['d'] = false;
                  keysPressed.current['arrowright'] = false;
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                }}
                onPointerCancel={() => {
                  keysPressed.current['d'] = false;
                  keysPressed.current['arrowright'] = false;
                }}
                className="group relative flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[24px] border border-white/15 bg-gradient-to-br from-white/[0.14] to-white/[0.04] text-white shadow-[0_10px_24px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-150 active:scale-[0.91] active:border-orange-400/70 active:bg-orange-500/20 active:shadow-[0_0_28px_rgba(249,115,22,0.35),inset_0_0_24px_rgba(249,115,22,0.18)] cursor-pointer touch-none"
                title="Sağa Git"
                aria-label="Sağa git"
              >
                <div className="absolute inset-2 rounded-[18px] border border-white/[0.06] bg-black/10" />
                <ChevronRight className="relative z-10 h-11 w-11 stroke-[3.2] text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.28)] transition-transform duration-150 group-active:translate-x-1 group-active:text-orange-200" />
                <span className="absolute bottom-2 text-[7px] font-black uppercase tracking-[0.2em] text-white/25">RIGHT</span>
              </button>
            </div>
          </div>

          {/* RIGHT: compact action buttons */}
          <div className="pointer-events-auto absolute right-2 bottom-2 w-[174px] h-[174px]">
            <button
              onClick={handlePlayerSpecial}
              disabled={specialCdLeft > 0}
              className={`absolute right-0 top-0 w-[72px] h-[72px] rounded-full border backdrop-blur-md bg-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.45)] active:scale-90 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                specialCdLeft > 0 ? 'border-white/10 text-white/35' : 'border-white/20 text-white hover:bg-white/15'
              }`}
              title="Ultra"
            >
              {specialCdLeft > 0 ? (
                <span className="font-mono text-sm font-black text-purple-300">{specialCdLeft.toFixed(1)}</span>
              ) : (
                <>
                  <Zap className="w-6 h-6 text-purple-300 drop-shadow-[0_0_10px_rgba(216,180,254,0.8)]" />
                  <span className="text-[9px] font-black uppercase tracking-wide mt-0.5">Ultra</span>
                </>
              )}
            </button>

            <button
              onClick={handlePlayerKick}
              disabled={kickCdLeft > 0}
              className={`absolute left-0 top-0 w-[72px] h-[72px] rounded-full border backdrop-blur-md bg-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.45)] active:scale-90 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                kickCdLeft > 0 ? 'border-white/10 text-white/35' : 'border-white/20 text-white hover:bg-white/15'
              }`}
              title="Kick"
            >
              {kickCdLeft > 0 ? (
                <span className="font-mono text-sm font-black text-orange-300">{kickCdLeft.toFixed(1)}</span>
              ) : (
                <>
                  <span className="text-2xl leading-none drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]">🦵</span>
                  <span className="text-[9px] font-black uppercase tracking-wide mt-0.5">Kick</span>
                </>
              )}
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                keysPressed.current['s'] = true;
              }}
              onPointerUp={(e) => {
                keysPressed.current['s'] = false;
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
              }}
              onPointerCancel={() => { keysPressed.current['s'] = false; }}
              onPointerLeave={(e) => {
                if (e.buttons === 0) keysPressed.current['s'] = false;
              }}
              className="absolute left-0 bottom-0 w-[72px] h-[72px] rounded-full border border-white/20 backdrop-blur-md bg-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.45)] text-white hover:bg-white/15 active:scale-90 transition-all flex flex-col items-center justify-center cursor-pointer"
              title="Guard"
            >
              <Shield className="w-7 h-7 text-sky-300 drop-shadow-[0_0_10px_rgba(125,211,252,0.8)]" />
              <span className="text-[9px] font-black uppercase tracking-wide mt-0.5">Guard</span>
            </button>

            <button
  onClick={handlePlayerPunch}
  disabled={punchCdLeft > 0}
  className={`absolute right-0 bottom-0 w-[84px] h-[84px] rounded-full border border-white/25 backdrop-blur-md shadow-[0_12px_35px_rgba(0,0,0,0.5)] text-white transition-all flex flex-col items-center justify-center cursor-pointer ${
    punchCdLeft > 0
      ? "bg-red-900/40 opacity-70"
      : "bg-white/10 hover:bg-white/15 active:scale-90"
  }`}
  title="Punch"
>
  {punchCdLeft > 0 ? (
    <span className="font-mono text-lg font-black">
      {punchCdLeft.toFixed(1)}
    </span>
  ) : (
    <>
      <span className="text-3xl leading-none drop-shadow-[0_0_12px_rgba(248,113,113,0.9)]">
        👊
      </span>
      <span className="text-[10px] font-black uppercase tracking-wide mt-1">
        Punch
      </span>
    </>
  )}
</button>
          </div>
        </div>
      )}
    </div>
  );
}
