
import { PlayerRole } from "./types";

export const ROLES: Record<PlayerRole, {
  name: string;
  description: string;
  nightAction?: string;
  team: 'village' | 'werewolves';
  nightPriority?: number;
}> = {
  werewolf: {
    name: "Werewolf",
    description: "Each night, choose a player to eliminate. Win when werewolves equal or outnumber villagers.",
    nightAction: "Choose a player to eliminate",
    team: 'werewolves',
    nightPriority: 2
  },
  villager: {
    name: "Villager",
    description: "You have no special abilities, but must use deduction to identify the werewolves.",
    team: 'village'
  },
  seer: {
    name: "Seer",
    description: "Each night, you may look at one player's card to learn their role.",
    nightAction: "Choose a player to identify",
    team: 'village',
    nightPriority: 1
  },
  doctor: {
    name: "Doctor",
    description: "Each night, choose one player (including yourself) to protect from elimination.",
    nightAction: "Choose a player to protect",
    team: 'village',
    nightPriority: 3
  },
  bodyguard: {
    name: "Bodyguard",
    description: "Each night, choose one player (excluding yourself) to protect from elimination.",
    nightAction: "Choose a player to protect",
    team: 'village',
    nightPriority: 3
  },
  hunter: {
    name: "Hunter",
    description: "If you are eliminated, you may immediately eliminate another player.",
    team: 'village'
  },
  witch: {
    name: "Witch",
    description: "You have two potions: one to save a player targeted by werewolves, and one to eliminate a player. Each can be used once per game.",
    nightAction: "Use save potion or poison potion",
    team: 'village',
    nightPriority: 4
  },
  "wolf-cub": {
    name: "Wolf Cub",
    description: "Part of the werewolf team. If eliminated, the werewolves get two kills the following night.",
    team: 'werewolves',
    nightPriority: 2
  },
  "spellcaster": {
    name: "Spellcaster",
    description: "Each night, choose one player to silence during the next day. They cannot vote or participate in discussions.",
    nightAction: "Choose a player to silence",
    team: 'village',
    nightPriority: 5
  }
};

export const ROLE_RECOMMENDATIONS: Record<number, PlayerRole[]> = {
  5: ['werewolf', 'werewolf', 'villager', 'villager', 'seer'],
  6: ['werewolf', 'werewolf', 'villager', 'villager', 'seer', 'doctor'],
  7: ['werewolf', 'werewolf', 'villager', 'villager', 'villager', 'seer', 'doctor'],
  8: ['werewolf', 'werewolf', 'villager', 'villager', 'villager', 'villager', 'seer', 'doctor'],
  9: ['werewolf', 'werewolf', 'werewolf', 'villager', 'villager', 'villager', 'villager', 'seer', 'doctor'],
  10: ['werewolf', 'werewolf', 'werewolf', 'villager', 'villager', 'villager', 'villager', 'villager', 'seer', 'doctor'],
  11: ['werewolf', 'werewolf', 'werewolf', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager', 'seer', 'doctor'],
  12: ['werewolf', 'werewolf', 'werewolf', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager', 'seer', 'doctor', 'bodyguard'],
  13: ['werewolf', 'werewolf', 'werewolf', 'werewolf', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager', 'seer', 'doctor', 'bodyguard'],
  14: ['werewolf', 'werewolf', 'werewolf', 'werewolf', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager', 'seer', 'doctor', 'bodyguard'],
  15: ['werewolf', 'werewolf', 'werewolf', 'werewolf', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager', 'seer', 'doctor', 'witch'],
};

export const DEFAULT_TIMER_SETTINGS: { day: number; night: number } = {
  day: 300, // 5 minutes in seconds
  night: 60 // 1 minute in seconds
};

export function getRecommendedRoles(playerCount: number): PlayerRole[] {
  // Use the predefined recommendations or create a balanced set
  if (ROLE_RECOMMENDATIONS[playerCount]) {
    return ROLE_RECOMMENDATIONS[playerCount];
  }
  
  // For undefined player counts, create a balanced role set
  // Base rule: 1/3 werewolves, at least 1 seer, 1 doctor if > 6 players
  const werewolfCount = Math.max(1, Math.floor(playerCount / 3));
  const specialRoles: PlayerRole[] = ['seer'];
  
  if (playerCount > 6) {
    specialRoles.push('doctor');
  }
  if (playerCount > 10) {
    specialRoles.push('witch');
  }
  if (playerCount > 12) {
    specialRoles.push('bodyguard');
  }
  if (playerCount > 14) {
    specialRoles.push('spellcaster');
  }
  
  const villagerCount = playerCount - werewolfCount - specialRoles.length;
  
  const roles: PlayerRole[] = [
    ...Array(werewolfCount).fill('werewolf'),
    ...Array(villagerCount).fill('villager'),
    ...specialRoles
  ] as PlayerRole[];
  
  return roles;
}

export function getNightActionOrder(players: PlayerRole[]): PlayerRole[] {
  const rolesWithActions = Object.entries(ROLES)
    .filter(([_, roleData]) => roleData.nightPriority !== undefined)
    .filter(([role]) => players.includes(role as PlayerRole))
    .sort((a, b) => (a[1].nightPriority || 99) - (b[1].nightPriority || 99))
    .map(([role]) => role as PlayerRole);
  
  return rolesWithActions;
}

// Helper to check if game is over and who won
export function checkWinCondition(players: {role: PlayerRole | null, status: string}[]): 'villagers' | 'werewolves' | null {
  const alivePlayers = players.filter(p => p.status === 'alive' && p.role);
  
  const aliveWerewolves = alivePlayers.filter(p => p.role === 'werewolf').length;
  const aliveVillagers = alivePlayers.filter(p => p.role !== 'werewolf').length;
  
  // Werewolves win when they equal or outnumber villagers
  if (aliveWerewolves >= aliveVillagers) {
    return 'werewolves';
  }
  
  // Villagers win when all werewolves are eliminated
  if (aliveWerewolves === 0) {
    return 'villagers';
  }
  
  // Game continues
  return null;
}
