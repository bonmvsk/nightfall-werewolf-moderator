
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
  | 'spellcaster';

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
  protected?: boolean;
  poisoned?: boolean;
  targetedBy?: string[];
  silenced?: boolean;
}

// Night action
export interface NightAction {
  roleId: string;
  roleName: string;
  targetId: string | null;
  actionType: string;
}

// Game state
export interface GameState {
  players: Player[];
  gamePhase: GamePhase;
  gameMode: GameMode;
  currentNightRole: string | null;
  nightActions: NightAction[];
  dayTimeRemaining: number;
  nightTimeRemaining: number;
  dayTimerActive: boolean;
  nightTimerActive: boolean;
  eliminatedLastNight: string[];
  winner: 'villagers' | 'werewolves' | null;
}

// Timer settings
export interface TimerSettings {
  day: number;
  night: number;
}
