export interface Character {
  id: string;
  name: string;
  description: string;
  baseHealth: number;
  basePower: number;
  baseSpeed: number;

  baseKickDamage: number;
  baseSpecialDamage: number;
  guardReduction: number;
  punchRange: number;
  kickRange: number;
  cooldownReduction: number;

  healthLevel: number;
  damageLevel: number;
  heavyDamageLevel: number;
  speedLevel: number;
  cooldownLevel: number;

  unlocked: boolean;
  color: string;
  accentColor: string;
  avatar: string;
  image?: string;
}

export interface Opponent {
  id: number;
  name: string;
  health: number;
  damage: number;
  speed: number;
  color: string;
  accentColor: string;
  avatar: string;
  characterId?: string;
}

export interface PlayerProfile {
  name: string;
  totalWins: number;
  dailyStreak: number;
  lastDailyRewardClaimed: number | null;
}

export interface SoundSettings {
  soundOn: boolean;
  vibrationOn: boolean;
}

export type GameState =
  | 'menu'
  | 'character_select'
  | 'friend_match'
  | 'level_select'
  | 'versus'
  | 'battle'
  | 'settings'
  | 'campaign_level_select';