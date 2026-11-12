// Pure game rules. No React, no "@/" imports: game-data.check.ts runs this file directly with node.
import type { GameState, NightAction, NightActionType, Player, PlayerRole, Team } from "./types";

// Role names, descriptions and night prompts live in src/i18n/locales/*.json under roles.<id>.
export const ROLES: Record<PlayerRole, { team: Team; night?: NightActionType }> = {
  werewolf: { team: 'werewolves', night: 'kill' },
  'wolf-cub': { team: 'werewolves' }, // wakes in the werewolf step
  villager: { team: 'village' },
  seer: { team: 'village', night: 'view' },
  doctor: { team: 'village', night: 'heal' },
  bodyguard: { team: 'village', night: 'protect' },
  witch: { team: 'village', night: 'poison' }, // plus 'save' on the wolves' victim
  hunter: { team: 'village' },
  spellcaster: { team: 'village', night: 'silence' },
  huntress: { team: 'village', night: 'shoot' }, // once per game, still called every night
  'tough-guy': { team: 'village' },
  doppelganger: { team: 'village', night: 'copy' }, // village until the copied player dies
  tanner: { team: 'neutral' },
};

// Wake order. Witch must come after the werewolves so she knows who was attacked.
export const NIGHT_ORDER: PlayerRole[] = ['doppelganger', 'seer', 'werewolf', 'doctor', 'bodyguard', 'witch', 'huntress', 'spellcaster'];

export const DEFAULT_TIMER_SETTINGS: { day: number; night: number } = {
  day: 300, // 5 minutes in seconds
  night: 60 // 1 minute in seconds
};

export const isWolf = (role: PlayerRole | null | undefined) => !!role && ROLES[role].team === 'werewolves';

export function getRecommendedRoles(playerCount: number): PlayerRole[] {
  // ponytail: ~1 wolf per 4 players, fixed thresholds for specials; tune here if games feel lopsided
  const wolfCount = Math.max(1, Math.floor((playerCount + 1) / 4));
  const wolves: PlayerRole[] = Array(wolfCount).fill('werewolf');
  if (playerCount >= 11) wolves[0] = 'wolf-cub';

  const specials: PlayerRole[] = ['seer'];
  if (playerCount >= 6) specials.push('doctor');
  if (playerCount >= 8) specials.push('hunter');
  if (playerCount >= 10) specials.push('witch');
  if (playerCount >= 12) specials.push('bodyguard');
  if (playerCount >= 14) specials.push('spellcaster');

  const villagers: PlayerRole[] = Array(Math.max(0, playerCount - wolfCount - specials.length)).fill('villager');
  return [...wolves, ...specials, ...villagers].slice(0, playerCount);
}

// Returns an i18n key under "setup." when the role list can't start a game, else null.
export function roleSetupError(roles: PlayerRole[], playerCount: number): string | null {
  if (playerCount < 5) return 'needMorePlayers';
  if (roles.length !== playerCount) return 'rolesMismatch';
  const wolves = roles.filter(isWolf).length;
  if (wolves === 0 || wolves >= roles.length - wolves) return 'badWolfCount';
  return null;
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Night steps for the living roles. Wolf cub wakes in the werewolf step; a doppelganger only until it has picked.
export function getNightActionOrder(players: Player[], doppelgangers: Record<string, string> = {}): PlayerRole[] {
  const awake = new Set(players
    .filter(p => p.status === 'alive' && p.role && !(p.role === 'doppelganger' && doppelgangers[p.id]))
    .map(p => (isWolf(p.role) ? 'werewolf' : p.role)));
  return NIGHT_ORDER.filter(r => awake.has(r));
}

// Who a role may target tonight.
export function nightCandidates(role: PlayerRole, players: Player[], previousNightActions: NightAction[]): Player[] {
  const alive = players.filter(p => p.status === 'alive');
  const lastTarget = previousNightActions.find(a => a.roleId === role)?.targetId;
  switch (role) {
    case 'werewolf': return alive.filter(p => !isWolf(p.role));
    case 'doctor':
    case 'bodyguard': return alive.filter(p => p.id !== lastTarget); // self allowed, no repeat
    case 'witch': return alive;
    default: return alive.filter(p => p.role !== role); // seer, spellcaster, huntress, doppelganger: not themselves
  }
}

export function checkWinCondition(players: { role: PlayerRole | null, status: string }[]): 'villagers' | 'werewolves' | null {
  const alive = players.filter(p => p.status === 'alive' && p.role);
  const wolves = alive.filter(p => isWolf(p.role)).length;
  if (wolves === 0) return 'villagers';
  if (wolves >= alive.length - wolves) return 'werewolves';
  return null;
}

// Kills the living players in ids. A surviving doppelganger whose pick died takes over that role.
function applyDeaths(players: Player[], ids: string[], doppelgangers: Record<string, string>) {
  const dying = players.filter(p => p.status === 'alive' && ids.includes(p.id));
  const byId = new Map(dying.map(p => [p.id, p]));
  return {
    players: players.map(p => {
      if (byId.has(p.id)) return { ...p, status: 'dead' as const, silenced: false };
      const copied = byId.get(doppelgangers[p.id]);
      return p.status === 'alive' && p.role === 'doppelganger' && copied ? { ...p, role: copied.role } : p;
    }),
    dyingIds: dying.map(p => p.id),
    hunters: dying.filter(p => p.role === 'hunter').map(p => p.id),
    cubDied: dying.some(p => p.role === 'wolf-cub'),
  };
}

function killNow(s: GameState, ids: string[], hunterQueue: string[]): Partial<GameState> {
  const d = applyDeaths(s.players, ids, s.doppelgangers);
  return {
    players: d.players,
    pendingHunters: [...hunterQueue, ...d.hunters],
    wolfExtraKill: s.wolfExtraKill || d.cubDied,
  };
}

// Village vote: one per day. Voting out the Tanner ends the game in their favour.
export function lynch(s: GameState, playerId: string): Partial<GameState> {
  const result: Partial<GameState> = { ...killNow(s, [playerId], s.pendingHunters), lynchedToday: true };
  const tanner = s.players.find(p => p.id === playerId)?.role === 'tanner';
  return tanner ? { ...result, winner: 'tanner', gamePhase: 'result', dayTimerActive: false } : result;
}

// First pending hunter fires (or passes with null). A shot hunter queues up next.
export const hunterShot = (s: GameState, targetId: string | null): Partial<GameState> =>
  killNow(s, targetId ? [targetId] : [], s.pendingHunters.slice(1));

// Dawn: a protected player survives every night kill (Ultimate Werewolf TH rule).
// A Tough Guy's delayed death from an earlier bite cannot be prevented.
export function resolveNight(s: GameState): Partial<GameState> {
  const targets = (type: NightActionType) => s.nightActions.filter(a => a.actionType === type).map(a => a.targetId);
  const shielded = new Set([...targets('heal'), ...targets('protect'), ...targets('save')]);
  const unshielded = (ids: string[]) => ids.filter(id => !shielded.has(id));
  const bites = unshielded(targets('kill'));
  const isToughGuy = (id: string) => s.players.find(p => p.id === id)?.role === 'tough-guy';
  const deaths = [...bites.filter(id => !isToughGuy(id)), ...unshielded([...targets('poison'), ...targets('shoot')]), ...s.toughGuyDoomed];
  const silenced = new Set(targets('silence'));

  // ponytail: doppelgangers link in wake order to the copy picks; one pick per night is the normal case
  const doppelgangers = { ...s.doppelgangers };
  const unlinked = s.players.filter(p => p.role === 'doppelganger' && p.status === 'alive' && !doppelgangers[p.id]);
  targets('copy').forEach((id, i) => { if (unlinked[i]) doppelgangers[unlinked[i].id] = id; });

  const d = applyDeaths(s.players, deaths, doppelgangers);

  return {
    players: d.players.map(p => ({ ...p, silenced: p.status === 'alive' && silenced.has(p.id) })),
    eliminatedLastNight: d.dyingIds,
    pendingHunters: d.hunters,
    wolfExtraKill: d.cubDied, // tonight's bonus kill (if any) is used up
    toughGuyDoomed: bites.filter(id => isToughGuy(id) && !d.dyingIds.includes(id)),
    doppelgangers,
    huntressShotUsed: s.huntressShotUsed || targets('shoot').length > 0,
    witchPotions: {
      heal: s.witchPotions.heal && targets('save').length === 0,
      poison: s.witchPotions.poison && targets('poison').length === 0,
    },
    previousNightActions: s.nightActions,
    lynchedToday: false,
    gamePhase: 'day',
  };
}
