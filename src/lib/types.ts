// Game phases
export type GamePhase = 'setup' | 'role-reveal' | 'night' | 'day' | 'result';

// Player roles
export type PlayerRole =
  | 'werewolf'
  | 'villager'
  | 'seer'
  | 'doctor'
  | 'bodyguard'
  | 'hunter'
  | 'witch'
  | 'wolf-cub'
  | 'spellcaster'
  | 'huntress'
  | 'tough-guy'
  | 'doppelganger'
  | 'tanner';

export type Team = 'village' | 'werewolves' | 'neutral';

// Game modes
export type GameMode = 'system' | 'cards';

// Player status
export type PlayerStatus = 'alive' | 'dead';

// Player interface
export interface Player {
  id: string;
  name: string;
  role: PlayerRole | null;
  status: PlayerStatus;
  silenced?: boolean;
}

export type NightActionType = 'kill' | 'view' | 'heal' | 'protect' | 'save' | 'poison' | 'silence' | 'shoot' | 'copy';

// Night action
export interface NightAction {
  roleId: PlayerRole;
  targetId: string;
  actionType: NightActionType;
}

// Game state
export interface GameState {
  players: Player[];
  gamePhase: GamePhase;
  gameMode: GameMode;
  roleSetup: PlayerRole[];
  nightActions: NightAction[];
  previousNightActions: NightAction[];
  witchPotions: { heal: boolean; poison: boolean };
  huntressShotUsed: boolean;
  toughGuyDoomed: string[]; // bitten Tough Guys, die at the next dawn
  doppelgangers: Record<string, string>; // doppelganger player id -> copied player id
  wolfExtraKill: boolean;
  pendingHunters: string[];
  lynchedToday: boolean;
  dayTimeRemaining: number;
  nightTimeRemaining: number;
  dayTimerActive: boolean;
  nightTimerActive: boolean;
  eliminatedLastNight: string[];
  winner: 'villagers' | 'werewolves' | 'tanner' | null;
}

// Timer settings
export interface TimerSettings {
  day: number;
  night: number;
}
