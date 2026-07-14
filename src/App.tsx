import React, { useState, useEffect } from 'react';
import { GameState, Character, Opponent, PlayerProfile } from './types';
import { INITIAL_CHARACTERS, OPPONENTS, CHARACTER_UNLOCK_WIN_THRESHOLDS, TEST_MODE } from './utils/gameData';
import {
  initAudio,
  playSFX,
  setAudioEnabled,
  setVibrationEnabled,
  playMenuMusic,
  playBattleMusic,
  stopMusic
} from './utils/audio';
import VersusScreen from './components/VersusScreen';
// Custom component imports
import MainMenu from './components/MainMenu';
import CharacterSelection from './components/CharacterSelection';

import LevelSelection from './components/LevelSelection';
import GameArena from './components/GameArena';
import SettingsPanel from './components/SettingsPanel';
import CampaignLevelSelection from './components/CampaignLevelSelection';
import { generateCampaignLevels, CampaignLevel } from './utils/levelData';

const LOCAL_STORAGE_KEY = 'street_fight_rush_save_v1';
const LEGACY_STORAGE_KEY = 'street_boxing_rush_save_v1';
const MAX_OPPONENT_ID = Math.max(...OPPONENTS.map(opponent => opponent.id));
const CAMPAIGN_LEVEL_COUNT = 60;

export default function App() {
  // --- Game State ---
  const [coins, setCoins] = useState<number>(200);
  const [unlockedOpponentId, setUnlockedOpponentId] = useState<number>(MAX_OPPONENT_ID);
  const [matchesWon, setMatchesWon] = useState<number>(0);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('rookie');
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>({
    name: 'RUSH CHAMP',
    totalWins: 0,
    dailyStreak: 1,
    lastDailyRewardClaimed: null
  });
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [vibrationOn, setVibrationOn] = useState<boolean>(true);

  // Screen Management (Açılış ekranı için başlangıç state'i 'splash' yapıldı)
  const [currentScreen, setCurrentScreen] = useState<GameState | 'splash'>('splash');
  const [activeOpponent, setActiveOpponent] = useState<Opponent | null>(null);
  const [activeReplayData, setActiveReplayData] = useState<any | null>(null);
  const [versusReturnScreen, setVersusReturnScreen] = useState<
    'level_select' | 'campaign_level_select'
  >('level_select');

  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // --- Campaign States ---
  const [unlockedLevel, setUnlockedLevel] = useState<number>(CAMPAIGN_LEVEL_COUNT);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [selectedCampaignLevel, setSelectedCampaignLevel] = useState<number>(1);
  const [activeCampaignLevel, setActiveCampaignLevel] = useState<CampaignLevel | null>(null);
  const [isCampaignFight, setIsCampaignFight] = useState<boolean>(false);
  const campaignLevels = React.useMemo(
    () => generateCampaignLevels().filter(level => level.levelNumber <= CAMPAIGN_LEVEL_COUNT),
    []
  );

  // Custom Campaign overlay popup result
  const [campaignResult, setCampaignResult] = useState<{
    result: 'win' | 'lose';
    levelNumber: number;
    coinsEarned: number;
  } | null>(null);

  // --- Load State on Mount ---
  useEffect(() => {
    initAudio();
    setUnlockedOpponentId(MAX_OPPONENT_ID);
    localStorage.setItem('unlockedOpponentId', JSON.stringify(MAX_OPPONENT_ID));

    // Load Campaign individual keys
    const storedUnlockedLevel = localStorage.getItem('unlockedLevel');
    setUnlockedLevel(CAMPAIGN_LEVEL_COUNT);
    localStorage.setItem('unlockedLevel', JSON.stringify(CAMPAIGN_LEVEL_COUNT));
    const storedCompletedLevels = localStorage.getItem('completedLevels');
    if (storedCompletedLevels) {
      try {
        setCompletedLevels(JSON.parse(storedCompletedLevels));
      } catch (e) {
        console.error('Error parsing completedLevels', e);
      }
    }
    const storedSelectedCampaignLevel = localStorage.getItem('selectedCampaignLevel');
    if (storedSelectedCampaignLevel) {
      try {
        setSelectedCampaignLevel(JSON.parse(storedSelectedCampaignLevel));
      } catch (e) {
        console.error('Error parsing selectedCampaignLevel', e);
      }
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.coins !== undefined) setCoins(parsed.coins);
        setUnlockedOpponentId(MAX_OPPONENT_ID);
        if (parsed.matchesWon !== undefined) setMatchesWon(parsed.matchesWon);
        if (parsed.selectedCharacterId !== undefined) setSelectedCharacterId(parsed.selectedCharacterId);
        if (parsed.characters !== undefined) {
          setCharacters(
            TEST_MODE
              ? parsed.characters.map((character: Character) => ({ ...character, unlocked: true }))
              : parsed.characters
          );
        }
        if (parsed.playerProfile !== undefined) setPlayerProfile(parsed.playerProfile);
        if (parsed.soundOn !== undefined) {
          setSoundOn(parsed.soundOn);
          setAudioEnabled(parsed.soundOn);
        }
        if (parsed.vibrationOn !== undefined) {
          setVibrationOn(parsed.vibrationOn);
          setVibrationEnabled(parsed.vibrationOn);
        }
        if (parsed.unlockedLevel !== undefined && !storedUnlockedLevel) {
          setUnlockedLevel(CAMPAIGN_LEVEL_COUNT);
        }
        if (parsed.completedLevels !== undefined && !storedCompletedLevels) {
          setCompletedLevels(parsed.completedLevels);
        }
        if (parsed.selectedCampaignLevel !== undefined && !storedSelectedCampaignLevel) {
          setSelectedCampaignLevel(parsed.selectedCampaignLevel);
        }
      } catch (e) {
        console.error('Error parsing save data', e);
      }
    }
  }, []);

  useEffect(() => {
    setUnlockedLevel(CAMPAIGN_LEVEL_COUNT);
    localStorage.setItem('unlockedLevel', JSON.stringify(CAMPAIGN_LEVEL_COUNT));
  }, []);

  // --- Screen-based background music management ---
  useEffect(() => {
    if (!soundOn) {
      stopMusic();
      return;
    }

    // Giriş/Splash ekranında veya menüdeyken menü müziğini çal
    if (currentScreen === 'battle') {
      playBattleMusic();
    } else {
      playMenuMusic();
    }
  }, [currentScreen, soundOn]);

  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, []);

  // --- Save State on Changes ---
  const unlockCharactersForWins = (totalWins: number) => {
    setCharacters(prev => prev.map(c => {
      if (TEST_MODE) return { ...c, unlocked: true };

      const threshold = CHARACTER_UNLOCK_WIN_THRESHOLDS[c.id];
      if (!c.unlocked && threshold !== undefined && totalWins >= threshold) {
        return { ...c, unlocked: true };
      }
      return c;
    }));
  };

  useEffect(() => {
    const saveData = {
      coins,
      unlockedOpponentId: MAX_OPPONENT_ID,
      matchesWon,
      selectedCharacterId,
      characters,
      playerProfile,
      soundOn,
      vibrationOn,
      unlockedLevel: CAMPAIGN_LEVEL_COUNT,
      completedLevels,
      selectedCampaignLevel
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
    localStorage.setItem('selectedCharacterId', selectedCharacterId);
    
    localStorage.setItem('unlockedLevel', JSON.stringify(CAMPAIGN_LEVEL_COUNT));
    localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
    localStorage.setItem('selectedCampaignLevel', JSON.stringify(selectedCampaignLevel));
  }, [
    coins, unlockedOpponentId, matchesWon, selectedCharacterId, characters, playerProfile, 
    soundOn, vibrationOn, unlockedLevel, completedLevels, selectedCampaignLevel
  ]);

  useEffect(() => {
    unlockCharactersForWins(playerProfile.totalWins);
  }, [playerProfile.totalWins]);

  // --- Audio / Vibration hooks ---
  const handleToggleSound = () => {
    const nextVal = !soundOn;
    setSoundOn(nextVal);
    setAudioEnabled(nextVal);
  };

  const handleToggleVibration = () => {
    const nextVal = !vibrationOn;
    setVibrationOn(nextVal);
    setVibrationEnabled(nextVal);
  };

  // --- Coin management helper ---
  const handleSpendCoins = (amount: number): boolean => {
    if (coins >= amount) {
      setCoins(prev => prev - amount);
      return true;
    }
    return false;
  };

  const handleAddCoins = () => {
    setCoins(prev => prev + 500);
  };

  const handleClaimDailyReward = () => {
    const now = Date.now();
    const lastClaim = playerProfile.lastDailyRewardClaimed ?? 0;
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - lastClaim < oneDay) return false;

    const nextStreak = lastClaim === 0 || now - lastClaim >= oneDay * 2 ? 1 : playerProfile.dailyStreak + 1;
    const bonusCoins = 200 + Math.min(300, (nextStreak - 1) * 50);

    setPlayerProfile(prev => ({
      ...prev,
      totalWins: prev.totalWins,
      dailyStreak: nextStreak,
      lastDailyRewardClaimed: now
    }));
    setCoins(prev => prev + bonusCoins);
    playSFX('coin_collect');
    return true;
  };

  // --- Character Upgrade & Unlock Logic ---
  const handleUpgradeCharacter = (
    id: string,
    statType: 'health' | 'damage' | 'heavyDamage' | 'speed' | 'cooldown'
  ) => {
    const charIndex = characters.findIndex(c => c.id === id);
    if (charIndex === -1) return;

    const char = characters[charIndex];
    let currentLevel = 1;
    if (statType === 'health') currentLevel = char.healthLevel;
    else if (statType === 'damage') currentLevel = char.damageLevel;
    else if (statType === 'heavyDamage') currentLevel = char.heavyDamageLevel;
    else if (statType === 'speed') currentLevel = char.speedLevel;
    else if (statType === 'cooldown') currentLevel = char.cooldownLevel;

    const goldCost = currentLevel * 75;
    const canUpgrade = coins >= goldCost && char.unlocked;

    if (canUpgrade) {
      playSFX('upgrade_success');
      setCoins(prev => prev - goldCost);

      setCharacters(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            healthLevel: statType === 'health' ? c.healthLevel + 1 : c.healthLevel,
            damageLevel: statType === 'damage' ? c.damageLevel + 1 : c.damageLevel,
            heavyDamageLevel: statType === 'heavyDamage' ? c.heavyDamageLevel + 1 : c.heavyDamageLevel,
            speedLevel: statType === 'speed' ? c.speedLevel + 1 : c.speedLevel,
            cooldownLevel: statType === 'cooldown' ? c.cooldownLevel + 1 : c.cooldownLevel
          };
        }
        return c;
      }));
    }
  };

  const handleUnlockCharacter = (id: string) => {
    const charIndex = characters.findIndex(c => c.id === id);
    if (charIndex === -1) return;

    const char = characters[charIndex];
    if (!char.unlocked) {
      playSFX('upgrade_success');
      setCharacters(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            unlocked: true
          };
        }
        return c;
      }));
    }
  };

  // --- Battle Management ---
  const handleSelectCampaignLevel = (lvl: CampaignLevel) => {
    setSelectedCampaignLevel(lvl.levelNumber);
    localStorage.setItem('selectedCampaignLevel', JSON.stringify(lvl.levelNumber));
    
    const opp: Opponent = {
      id: lvl.levelNumber,
      name: lvl.enemyName,
      health: lvl.enemyHealth,
      damage: lvl.enemyDamage,
      speed: lvl.enemySpeed,
      color: lvl.color,
      accentColor: lvl.accentColor,
      avatar: lvl.avatar,
      characterId: lvl.enemyCharacterId
    };
    
    setIsCampaignFight(true);
    setActiveCampaignLevel(lvl);
    setActiveOpponent(opp);
    setVersusReturnScreen('campaign_level_select');
    setCurrentScreen('versus');
  };

  const handleSelectOpponent = (opponent: Opponent) => {
    const storedId = localStorage.getItem('selectedCharacterId');
    if (storedId) {
      setSelectedCharacterId(storedId);
    }
    setIsCampaignFight(false);
    setActiveCampaignLevel(null);
    setActiveOpponent(opponent);
    setVersusReturnScreen('level_select');
    setCurrentScreen('versus');
  };

  const handlePlayReplay = (replay: any) => {
    const recordedOpponent = {
      id: replay.opponentId,
      name: replay.opponentName,
      health: replay.snapshots[0]?.oHp || 100,
      damage: 10,
      speed: 5,
      color: 'bg-zinc-800',
      accentColor: 'border-zinc-700',
      avatar: replay.opponentAvatar || '🥊',
      characterId: replay.playerCharId
    };
    setActiveOpponent(recordedOpponent);
    setActiveReplayData(replay);
    setCurrentScreen('battle');
  };

  const handleMatchFinished = (
    result: 'win' | 'lose',
    coinsEarned: number
  ) => {
    if (isCampaignFight && activeCampaignLevel) {
      const currentLevel = activeCampaignLevel;

      if (result === 'win') {
        const reward = currentLevel.rewardCoins;

        setCoins(prev => prev + reward);
        setMatchesWon(prev => prev + 1);

        setPlayerProfile(prev => ({
          ...prev,
          totalWins: prev.totalWins + 1
        }));

        setCompletedLevels(prev => {
          const updatedLevels = prev.includes(currentLevel.levelNumber)
            ? prev
            : [...prev, currentLevel.levelNumber];

          localStorage.setItem(
            'completedLevels',
            JSON.stringify(updatedLevels)
          );

          return updatedLevels;
        });

        const nextLevel = campaignLevels.find(
          level => level.levelNumber === currentLevel.levelNumber + 1
        );

        if (nextLevel) {
          handleSelectCampaignLevel(nextLevel);
          setCurrentScreen('versus');
        } else {
          setActiveOpponent(null);
          setActiveCampaignLevel(null);
          setIsCampaignFight(false);
          setCurrentScreen('menu');
        }

        return;
      }

      handleSelectCampaignLevel(currentLevel);
      setCurrentScreen('versus');
      return;
    }

    if (!activeOpponent) return;

    const currentOpponent = activeOpponent;

    if (result === 'win') {
      setCoins(prev => prev + coinsEarned);
      setMatchesWon(prev => prev + 1);

      setPlayerProfile(prev => ({
        ...prev,
        totalWins: prev.totalWins + 1
      }));

      const nextOpponent = OPPONENTS.find(
        opponent => opponent.id === currentOpponent.id + 1
      );

      if (nextOpponent) {
        handleSelectOpponent(nextOpponent);
        setCurrentScreen('versus');
      } else {
        setActiveOpponent(null);
        setCurrentScreen('menu');
      }

      return;
    }

    handleSelectOpponent(currentOpponent);
    setCurrentScreen('versus');
  };

  const activeCharacter = characters.find(c => c.id === selectedCharacterId) || characters[0];

  if (isPortrait) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-[9999]">
        <div className="text-7xl mb-6"></div>
        <h1 className="text-3xl font-black uppercase text-orange-500">LÜTFEN EKRANI YAN</h1>
        <h1 className="text-3xl font-black uppercase text-orange-500">ÇEVİRİN</h1>
        <p className="mt-4 text-zinc-400 text-center max-w-sm px-6">
          Street Fight Rush yatay (landscape) modda oynanır.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen min-h-screen bg-[#0c0c0e] text-white overflow-hidden relative font-sans">
      
      {/* Visual Background Decoration from Vibrant Palette */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 vibrant-grid opacity-30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.15)_0%,transparent_65%)]"></div>
        <div className="absolute inset-0 vibrant-vignette opacity-90"></div>
      </div>

      {/* FULLSCREEN GAME WRAPPER */}
      <div className="fixed inset-0 w-screen min-h-screen bg-[#121212] overflow-hidden flex flex-col justify-between select-none z-10">

        {/* --- SCENE ROUTER --- */}
        <div className="flex-1 relative">
          
          {/* --- MODERN SPLASH / TAP TO START SCREEN --- */}
          {currentScreen === 'splash' && (
            <div 
              onClick={() => {
                
                setCurrentScreen('menu');
              }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 cursor-pointer animate-fade-in"
            >
              {/* Decorative background lights */}
              <div className="absolute w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
              
              <div className="z-10 text-center flex flex-col items-center gap-6">
                {/* Logo wrapper with modern glitch/glow effect */}
                <div className="relative group select-none">
                  <span className="absolute -inset-1 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 opacity-75 blur-md group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></span>
                  <div className="relative px-8 py-6 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col items-center">
                    <span className="text-zinc-500 text-xs font-black tracking-[0.4em] uppercase mb-1">
                      OZAN COSKUN
                    </span>
                    <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-red-500 drop-shadow-[0_4px_12px_rgba(249,115,22,0.3)]">
                      STREET FIGHT
                    </h1>
                    <h2 className="text-6xl md:text-7xl font-extrabold italic tracking-tight text-white -mt-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                      RUSH
                    </h2>
                  </div>
                </div>

                {/* Animated modern Tap to Start instruction */}
                <div className="mt-8 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3 px-6 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full animate-pulse shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                    <p className="text-sm font-black tracking-widest text-zinc-300 uppercase italic">
                      DEVAM ETMEK İÇİN EKRANA DOKUN
                    </p>
                  </div>
                 
                </div>
              </div>
            </div>
          )}

          {currentScreen === 'menu' && (
            <MainMenu
              onNavigate={(screen) => setCurrentScreen(screen)}
              activeCharacter={activeCharacter}
              playerProfile={playerProfile}
              matchesWon={Math.max(matchesWon, MAX_OPPONENT_ID)}
              unlockedOpponentId={MAX_OPPONENT_ID + 1}
              coins={coins}
              onClaimDailyReward={handleClaimDailyReward}
              onAddCoins={handleAddCoins}
              onOpenSettings={() => setCurrentScreen('settings')}
            />
          )}

          {currentScreen === 'character_select' && (
            <CharacterSelection
              characters={characters}
              selectedId={selectedCharacterId}
              onSelect={setSelectedCharacterId}
              onUpgrade={handleUpgradeCharacter}
              coins={coins}
              onUnlockCharacter={handleUnlockCharacter}
              onBack={() => setCurrentScreen('menu')} 
              onOpenShop={function (): void {
                throw new Error('Function not implemented.');
              } }            
            />
          )}

          {currentScreen === 'level_select' && (
            <LevelSelection
              opponents={OPPONENTS}
              unlockedId={MAX_OPPONENT_ID}
              onSelectOpponent={handleSelectOpponent}
              matchesWon={matchesWon}
              onBack={() => setCurrentScreen('menu')}
            />
          )}

          {currentScreen === 'campaign_level_select' && (
            <CampaignLevelSelection
              levels={campaignLevels}
              unlockedLevel={CAMPAIGN_LEVEL_COUNT}
              completedLevels={completedLevels}
              onSelectLevel={handleSelectCampaignLevel}
              onBack={() => setCurrentScreen('menu')}
            />
          )}

          {currentScreen === 'versus' && activeOpponent && (
            <VersusScreen
              player={activeCharacter}
              opponent={activeOpponent}
              matchLabel={
                isCampaignFight && activeCampaignLevel
                  ? `SEVİYE ${activeCampaignLevel.levelNumber}`
                  : `MAÇ #${activeOpponent.id}`
              }
              arenaName={isCampaignFight ? 'ŞAMPİYONLUK YOLU' : 'AMATÖR ARENA'}
              onStartFight={() => setCurrentScreen('battle')}
              onBack={() => {
                setActiveReplayData(null);
                setActiveOpponent(null);
                setActiveCampaignLevel(null);
                setCurrentScreen(versusReturnScreen);
              }}
            />
          )}

          {currentScreen === 'battle' && activeOpponent && (
            <GameArena
              player={activeCharacter}
              opponent={activeOpponent}
              replayData={activeReplayData}
              isCampaignFight={isCampaignFight}
              onMatchFinished={handleMatchFinished}
              onExit={() => {
                const wasReplay = !!activeReplayData;
                setActiveReplayData(null);
                setActiveOpponent(null);
                if (wasReplay) {
                  setCurrentScreen('menu');
                } else {
                  setCurrentScreen(isCampaignFight ? 'campaign_level_select' : 'level_select');
                }
              }}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsPanel
              soundOn={soundOn}
              vibrationOn={vibrationOn}
              onToggleSound={handleToggleSound}
              onToggleVibration={handleToggleVibration}
              onClose={() => setCurrentScreen('menu')}
            />
          )}
        </div>

        {/* --- CAMPAIGN MODE RESULT OVERLAYS (VICTORY / RETRY) --- */}
        {campaignResult && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
            {campaignResult.result === 'win' ? (
              /* CAMPAIGN VICTORY PANEL */
              <div className="w-full max-w-sm bg-gradient-to-br from-yellow-600 via-orange-600 to-red-700 border-4 border-white rounded-[32px] p-6 text-center shadow-[0_20px_50px_rgba(249,115,22,0.4)] flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(255,255,255,1)_1px,_transparent_1px)] bg-[size:100%_4px]" />
                
                <div>
                  <span className="bg-white text-orange-600 font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-wider italic">
                    SEVİYE {campaignResult.levelNumber} TAMAMLANDI!
                  </span>
                  <h2 className="text-white font-black text-2xl uppercase tracking-tight mt-3 italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                    KUSURSUZ ZAFER!
                  </h2>
                </div>

                <div className="text-6xl my-1 drop-shadow-xl animate-bounce">🏆</div>

                <div className="bg-black/35 p-3.5 rounded-2xl border border-white/25 space-y-2 text-left">
                  <span className="text-yellow-200 text-[10px] font-black uppercase tracking-wider block italic text-center border-b border-white/10 pb-1.5">
                    KAMPANYA ÖDÜLLERİ
                  </span>
                  
                  <div className="flex justify-between items-center text-sm font-bold text-white">
                    <span className="flex items-center gap-1.5">🪙 Kazanılan Altın</span>
                    <span className="font-mono text-yellow-300 font-black text-base flex items-center gap-0.5">
                      +{campaignResult.coinsEarned}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 relative z-10 mt-1">
                  {campaignResult.levelNumber < CAMPAIGN_LEVEL_COUNT ? (
                    <button
                      onClick={() => {
                        const nextLvlNum = campaignResult.levelNumber + 1;
                        setCampaignResult(null);
                        const nextLvl = campaignLevels.find(l => l.levelNumber === nextLvlNum);
                        if (nextLvl) {
                          handleSelectCampaignLevel(nextLvl);
                        }
                      }}
                      className="w-full py-3 bg-white text-orange-600 hover:bg-zinc-100 active:scale-[0.98] border-b-4 border-zinc-300 active:border-b-0 font-black text-xs uppercase italic rounded-2xl transition-all shadow-lg cursor-pointer animate-pulse"
                    >
                      SONRAKİ SEVİYE ({campaignResult.levelNumber + 1}) ➔
                    </button>
                  ) : (
                    <div className="py-2.5 bg-yellow-500 text-black text-xs font-black uppercase italic rounded-xl text-center">
                      👑 60 BÖLÜMÜ BİTİRDİN, ŞAMPİYON OLDUN!
                    </div>
                  )}
                  <button
                    onClick={() => setCampaignResult(null)}
                    className="w-full py-2 bg-black/40 hover:bg-black/60 text-white font-black text-xs uppercase italic rounded-xl transition-all border border-white/10 cursor-pointer"
                  >
                    SEVİYE SEÇİMİNE DÖN
                  </button>
                </div>
              </div>
            ) : (
              /* CAMPAIGN RETRY PANEL */
              <div className="w-full max-w-sm bg-[#161616]/98 border-2 border-zinc-800 rounded-[32px] p-6 text-center shadow-2xl flex flex-col gap-4 relative overflow-hidden">
                <div>
                  <span className="bg-red-600/15 border border-red-500/20 rounded-lg px-3 py-1 text-red-500 font-black text-[10px] uppercase tracking-wider">
                    SEVİYE {campaignResult.levelNumber} BAŞARISIZ
                  </span>
                  <h2 className="text-white font-black text-2xl uppercase tracking-tight mt-3 italic">YENİLGİ!</h2>
                </div>

                <div className="text-6xl my-1">🤕</div>

                <p className="text-zinc-400 text-xs leading-relaxed px-4">
                  Rakip seni nakavt etti! Gücünü ve Canını boksörler sayfasından yükseltip tekrar dene.
                </p>

                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={() => {
                      const currentLvlNum = campaignResult.levelNumber;
                      setCampaignResult(null);
                      const currentLvl = campaignLevels.find(l => l.levelNumber === currentLvlNum);
                      if (currentLvl) {
                        handleSelectCampaignLevel(currentLvl);
                      }
                    }}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white border-b-4 border-orange-950 active:border-b-0 font-black text-xs uppercase italic rounded-2xl transition-all shadow-lg cursor-pointer"
                  >
                    TEKRAR DENE
                  </button>
                  <button
                    onClick={() => setCampaignResult(null)}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 active:scale-95 text-zinc-400 font-black text-xs uppercase italic rounded-2xl border border-zinc-900 transition-all cursor-pointer"
                  >
                    SEVİYE SEÇİMİNE DÖN
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}