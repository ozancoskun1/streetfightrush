import { OPPONENTS } from './gameData';

export const CAMPAIGN_LEVEL_COUNT = 60;
export const LEVELS_PER_ARENA = 15;

export type CampaignDifficultyName =
  | 'Kolay'
  | 'Normal'
  | 'Zor'
  | 'Uzman'
  | 'Efsane'
  | 'İmkansız'
  | 'Patron';

export interface CampaignArena {
  id: number;
  name: string;
  subtitle: string;
  minLevel: number;
  maxLevel: number;
  healthMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  baseReward: number;
}

export interface CampaignLevel {
  levelNumber: number;
  arenaId: number;
  arenaName: string;
  arenaSubtitle: string;
  enemyName: string;
  enemyHealth: number;
  enemyDamage: number;
  enemySpeed: number;
  enemyCharacterId: string;
  color: string;
  accentColor: string;
  avatar: string;
  difficultyName: CampaignDifficultyName;
  rewardCoins: number;
  isBoss: boolean;
}

export const CAMPAIGN_ARENAS: CampaignArena[] = [
  {
    id: 1,
    name: 'Sokak Arenası',
    subtitle: 'Şehrin arka sokaklarında adını duyur.',
    minLevel: 1,
    maxLevel: 15,
    healthMultiplier: 0.82,
    damageMultiplier: 0.90,
    speedMultiplier: 0.98,
    baseReward: 50
  },
  {
    id: 2,
    name: 'Yeraltı Çukuru',
    subtitle: 'Kuralsız dövüşlerin karanlık merkezi.',
    minLevel: 16,
    maxLevel: 30,
    healthMultiplier: 1.05,
    damageMultiplier: 1.12,
    speedMultiplier: 1.04,
    baseReward: 90
  },
  {
    id: 3,
    name: 'Cyber Kubbe',
    subtitle: 'Hızın ve teknolojinin hüküm sürdüğü ring.',
    minLevel: 31,
    maxLevel: 45,
    healthMultiplier: 1.30,
    damageMultiplier: 1.32,
    speedMultiplier: 1.10,
    baseReward: 140
  },
  {
    id: 4,
    name: 'Şampiyonlar Kolezyumu',
    subtitle: 'Yalnızca efsanelerin ayakta kalabildiği son arena.',
    minLevel: 46,
    maxLevel: 60,
    healthMultiplier: 1.60,
    damageMultiplier: 1.55,
    speedMultiplier: 1.16,
    baseReward: 220
  }
];

const ARENA_ENEMY_NAMES: string[][] = [
  [
    'Street Rookie',
    'Kick King',
    'Shaolin Iron Monk',
    'Brawler Titan',
    'Nightshade Shadow',
    'Siam Cyclone',
    'Saber Shinobi',
    'Crazy Dan Jester',
    'Aurelius Dragon',
    'Cyber X Crusher',
    'Samurai Katashi',
    'Bison El Macho',
    'Grandmaster Lee',
    'Golden Boxing Queen',
    'Nihil Dark Lord'
  ],
  [
    'Backstreet Prospect',
    'Amber Viper',
    'Iron Temple Monk',
    'Concrete Colossus',
    'Midnight Phantom',
    'Bangkok Storm',
    'Crimson Shinobi',
    'Grin Reaper',
    'Inferno Dragon',
    'Neon Crusher',
    'Ronin Kage',
    'Underground Bull',
    'Master Wong',
    'Velvet Knockout',
    'Abyss Overlord'
  ],
  [
    'Unit R-01',
    'Velocity X',
    'Mecha Monk',
    'Titan-404',
    'Ghost Protocol',
    'Nano Cyclone',
    'Cyber Shinobi',
    'Glitch Jester',
    'Plasma Dragon',
    'Omega Crusher',
    'Chrome Samurai',
    'Bio-Bison',
    'Quantum Master',
    'Nova Queen',
    'Void Prime'
  ],
  [
    'World Challenger',
    'Lightning Champion',
    'Immortal Monk',
    'Titan King',
    'Shadow Emperor',
    'Muay Thai Legend',
    'Phantom Shogun',
    'Chaos King',
    'Dragon Emperor',
    'Cyber Warlord',
    'Last Samurai',
    'Arena Beast',
    'Supreme Grandmaster',
    'Undisputed Queen',
    'Eternal Dark Lord'
  ]
];

function getDifficultyName(arenaIndex: number, opponentIndex: number): CampaignDifficultyName {
  if (opponentIndex === LEVELS_PER_ARENA - 1) return 'Patron';

  const difficultyBands: CampaignDifficultyName[][] = [
    ['Kolay', 'Normal', 'Zor'],
    ['Normal', 'Zor', 'Uzman'],
    ['Zor', 'Uzman', 'Efsane'],
    ['Uzman', 'Efsane', 'İmkansız']
  ];

  const bandIndex = opponentIndex <= 4 ? 0 : opponentIndex <= 9 ? 1 : 2;
  return difficultyBands[arenaIndex][bandIndex];
}

export function getCampaignArenaForLevel(levelNumber: number): CampaignArena {
  const safeLevel = Math.min(CAMPAIGN_LEVEL_COUNT, Math.max(1, levelNumber));
  const arenaIndex = Math.floor((safeLevel - 1) / LEVELS_PER_ARENA);
  return CAMPAIGN_ARENAS[arenaIndex];
}

export function generateCampaignLevels(): CampaignLevel[] {
  if (OPPONENTS.length !== LEVELS_PER_ARENA) {
    console.warn(
      `Kampanya sistemi ${LEVELS_PER_ARENA} ana rakip bekliyor, fakat ${OPPONENTS.length} rakip bulundu.`
    );
  }

  return CAMPAIGN_ARENAS.flatMap((arena, arenaIndex) =>
    OPPONENTS.slice(0, LEVELS_PER_ARENA).map((baseOpponent, opponentIndex) => {
      const levelNumber = arenaIndex * LEVELS_PER_ARENA + opponentIndex + 1;
      const isBoss = opponentIndex === LEVELS_PER_ARENA - 1;

      // Aynı 15 ana rakip her arenada tekrar kullanılır; arena ve sıra ilerledikçe
      // can, hasar, hız, yapay zekâ tepkisi ve ödül birlikte yükselir.
      const positionHealthMultiplier = 1 + opponentIndex * 0.025;
      const positionDamageMultiplier = 1 + opponentIndex * 0.018;
      const positionSpeedMultiplier = 1 + opponentIndex * 0.005;
      const bossHealthMultiplier = isBoss ? 1.20 : 1;
      const bossDamageMultiplier = isBoss ? 1.14 : 1;

      return {
        levelNumber,
        arenaId: arena.id,
        arenaName: arena.name,
        arenaSubtitle: arena.subtitle,
        enemyName: ARENA_ENEMY_NAMES[arenaIndex][opponentIndex] ?? baseOpponent.name,
        enemyHealth: Math.round(
          baseOpponent.health *
          arena.healthMultiplier *
          positionHealthMultiplier *
          bossHealthMultiplier
        ),
        enemyDamage: Math.max(
          1,
          Math.round(
            baseOpponent.damage *
            arena.damageMultiplier *
            positionDamageMultiplier *
            bossDamageMultiplier
          )
        ),
        enemySpeed: Number(
          (
            baseOpponent.speed *
            arena.speedMultiplier *
            positionSpeedMultiplier
          ).toFixed(1)
        ),
        enemyCharacterId: baseOpponent.characterId ?? 'rookie',
        color: baseOpponent.color,
        accentColor: baseOpponent.accentColor,
        avatar: baseOpponent.avatar,
        difficultyName: getDifficultyName(arenaIndex, opponentIndex),
        rewardCoins:
          arena.baseReward +
          opponentIndex * 8 +
          levelNumber * 2 +
          (isBoss ? 150 : 0),
        isBoss
      };
    })
  );
}
