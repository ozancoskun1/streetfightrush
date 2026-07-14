let audioCtx: AudioContext | null = null;
let isSoundEnabled = true;
let isVibrationEnabled = true;

type SFXType =
  | 'button_click'
  | 'punch_light'
  | 'punch_heavy'
  | 'throw_attack'
  | 'hit_body'
  | 'guard_block'
  | 'knockout'
  | 'match_win'
  | 'match_lose'
  | 'coin_collect'
  | 'upgrade_success'
  | 'fight_bell'
  | 'fight_start';

type MusicType = 'menu' | 'battle' | null;

const SOUND_FILES: Partial<Record<SFXType, string>> = {
  punch_light: '/sounds/punch.mp3',
  punch_heavy: '/sounds/kick.mp3',
  fight_bell: '/sounds/bell.mp3',
  match_win: '/sounds/victory.mp3',
};

const MENU_MUSIC_PATH = '/sounds/menu.mp3';
const BATTLE_MUSIC_PATH = '/sounds/fight_background.mp3';

let menuMusic: HTMLAudioElement | null = null;
let battleMusic: HTMLAudioElement | null = null;
let desiredMusic: MusicType = null;
let unlockListenersAdded = false;

function ensureMusicPlayers() {
  if (typeof window === 'undefined') return;

  if (!menuMusic) {
    menuMusic = new Audio(MENU_MUSIC_PATH);
    menuMusic.loop = true;
    menuMusic.volume = 0.38;
    menuMusic.preload = 'auto';
  }

  if (!battleMusic) {
    battleMusic = new Audio(BATTLE_MUSIC_PATH);
    battleMusic.loop = true;
    battleMusic.volume = 0.42;
    battleMusic.preload = 'auto';
  }
}

function pauseMusicPlayer(
  player: HTMLAudioElement | null,
  resetTime = true,
) {
  if (!player) return;

  player.pause();

  if (resetTime) {
    try {
      player.currentTime = 0;
    } catch {}
  }
}

async function startDesiredMusic() {
  if (!isSoundEnabled || !desiredMusic) return;

  ensureMusicPlayers();

  const target = desiredMusic === 'menu' ? menuMusic : battleMusic;
  const other = desiredMusic === 'menu' ? battleMusic : menuMusic;

  pauseMusicPlayer(other);

  if (!target || !target.paused) return;

  try {
    await target.play();
  } catch {
    // Mobil tarayıcı ilk kullanıcı etkileşimine kadar sesi engelleyebilir.
    // initAudio içindeki pointer/keyboard dinleyicisi tekrar deneyecek.
  }
}

export function initAudio() {
  if (typeof window === 'undefined') return;

  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  ensureMusicPlayers();

  if (!unlockListenersAdded) {
    unlockListenersAdded = true;

    const unlockAudio = () => {
      if (audioCtx?.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      void startDesiredMusic();

      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio, { passive: true });
  }
}

export function playMenuMusic() {
  desiredMusic = 'menu';
  void startDesiredMusic();
}

export function playBattleMusic() {
  desiredMusic = 'battle';
  void startDesiredMusic();
}

export function stopMusic() {
  desiredMusic = null;
  pauseMusicPlayer(menuMusic);
  pauseMusicPlayer(battleMusic);
}

export function setAudioEnabled(enabled: boolean) {
  isSoundEnabled = enabled;

  if (!enabled) {
    // Bulunulan ekranın müzik tercihini koru, yalnızca sesi durdur.
    pauseMusicPlayer(menuMusic, false);
    pauseMusicPlayer(battleMusic, false);
    return;
  }

  void startDesiredMusic();
}

export function setVibrationEnabled(enabled: boolean) {
  isVibrationEnabled = enabled;
}

function triggerVibrate(pattern: number | number[]) {
  if (
    isVibrationEnabled &&
    typeof window !== 'undefined' &&
    window.navigator?.vibrate
  ) {
    try {
      window.navigator.vibrate(pattern);
    } catch {}
  }
}

function playSoundFile(type: SFXType) {
  if (!isSoundEnabled) return;

  const src = SOUND_FILES[type];
  if (!src) return;

  const audio = new Audio(src);
  audio.volume = 0.9;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function playSFX(type: SFXType) {
  if (!isSoundEnabled) return;

  // Dövüş müziği artık burada başlatılmıyor.
  // App.tsx ekran değişimine göre playBattleMusic çağırıyor.
  if (type === 'fight_start') {
    triggerVibrate(25);
    return;
  }

  if (SOUND_FILES[type]) {
    playSoundFile(type);

    if (type === 'punch_light') triggerVibrate(20);
    if (type === 'punch_heavy') triggerVibrate(30);
    if (type === 'fight_bell') triggerVibrate(40);
    if (type === 'match_win') triggerVibrate([40, 30, 60]);

    return;
  }

  try {
    if (!audioCtx) {
      audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const ctx = audioCtx;
    const now = ctx.currentTime;

    switch (type) {
      case 'button_click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);

        triggerVibrate(8);
        break;
      }

      case 'throw_attack': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(300, now);
        osc1.frequency.exponentialRampToValueAtTime(100, now + 0.25);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(200, now);
        osc2.frequency.exponentialRampToValueAtTime(50, now + 0.25);

        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(ctx.destination);
        gain2.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);

        triggerVibrate([70, 35, 70]);
        break;
      }

      case 'hit_body': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);

        triggerVibrate(35);
        break;
      }

      case 'guard_block': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);

        triggerVibrate(12);
        break;
      }

      case 'knockout': {
        const duration = 0.8;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + duration);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);

        triggerVibrate([120, 60, 160]);
        break;
      }

      case 'match_lose': {
        const notes = [311.13, 277.18, 233.08, 196.0];

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0.15, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(
            0.01,
            now + idx * 0.12 + 0.2,
          );

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.2);
        });

        triggerVibrate([80, 40, 80]);
        break;
      }

      case 'coin_collect': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setValueAtTime(0.15, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);

        triggerVibrate(15);
        break;
      }

      case 'upgrade_success': {
        const duration = 0.5;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc1.frequency.exponentialRampToValueAtTime(1760, now + duration);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(554.37, now + 0.1);
        osc2.frequency.setValueAtTime(659.25, now + 0.2);
        osc2.frequency.setValueAtTime(880, now + 0.3);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);

        triggerVibrate([25, 25, 45]);
        break;
      }
    }
  } catch (error) {
    console.error('Audio failed', error);
  }
}
