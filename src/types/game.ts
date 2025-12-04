export type CharacterType = 'knight' | 'king' | 'queen' | 'goblin' | 'custom';
export type FactionType = 'knights' | 'dragons' | 'wizards' | 'goblins' | 'elves' | 'custom';

export interface Character {
  type: CharacterType;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  isMoving: boolean;
  direction: 'left' | 'right';
  animationFrame: number;
}

export interface CoinData {
  name: string;
  symbol: string;
  description: string;
  tokenImage?: File;
  twitterUrl?: string;
  telegramUrl?: string;
  websiteUrl?: string;
}

export interface Faction {
  id: FactionType;
  name: string;
  color: string;
  treasury: number;
  armoryReserve: number;
  leader?: string;
  members: string[];
  territory: Territory;
  claimed: boolean;
}

export interface Territory {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player {
  id: string;
  name: string;
  screenName: string;
  faction: FactionType;
  position: { x: number; y: number; z: number };
  health: number;
  inventory: Inventory;
  wallet: string;
}

export interface Inventory {
  arrows: number;
  bombs: number;
}

export enum GameState {
  MAIN_MENU = 'main_menu',
  FACTION_SELECT = 'faction_select',
  CHARACTER_CUSTOMIZE = 'character_customize',
  IN_GAME = 'in_game',
  BATTLE = 'battle'
}