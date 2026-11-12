// Rule self-check. Run: node src/lib/game-data.check.ts
import {
  checkWinCondition, getNightActionOrder, getRecommendedRoles, hunterShot, lynch,
  nightCandidates, resolveNight, roleSetupError,
} from "./game-data.ts";
import type { GameState, NightAction, PlayerRole } from "./types.ts";

const ok = (cond: unknown, msg: string) => { if (!cond) throw new Error(msg); };

const game = (roles: PlayerRole[], over: Partial<GameState> = {}): GameState => ({
  players: roles.map((role, i) => ({ id: `p${i}`, name: `P${i}`, role, status: 'alive' })),
  gamePhase: 'night', gameMode: 'system', roleSetup: roles,
  nightActions: [], previousNightActions: [],
  witchPotions: { heal: true, poison: true }, wolfExtraKill: false,
  huntressShotUsed: false, toughGuyDoomed: [], doppelgangers: {},
  pendingHunters: [], lynchedToday: false,
  dayTimeRemaining: 0, nightTimeRemaining: 0, dayTimerActive: false, nightTimerActive: false,
  eliminatedLastNight: [], winner: null, ...over,
});
const act = (roleId: PlayerRole, actionType: NightAction['actionType'], targetId: string): NightAction =>
  ({ roleId, actionType, targetId });
const dead = (s: Partial<GameState>) => s.players!.filter(p => p.status === 'dead').map(p => p.id);

// Wolf cub is a wolf for the win check
ok(checkWinCondition(game(['wolf-cub', 'villager']).players) === 'werewolves', 'cub counts as wolf');
ok(checkWinCondition(game(['wolf-cub', 'villager', 'seer']).players) === null, 'cub 1 v 2 continues');
ok(checkWinCondition([]) === 'villagers', '0 v 0 is not a wolf win');

// Wolf cub wakes with the werewolves
ok(getNightActionOrder(game(['wolf-cub', 'villager', 'seer', 'witch', 'doppelganger']).players).join() === 'doppelganger,seer,werewolf,witch', 'night order');
ok(!getNightActionOrder(game(['doppelganger', 'werewolf']).players, { p0: 'p1' }).includes('doppelganger'), 'doppelganger wakes only until it picks');

// Witch save beats the bite, poison kills, both potions used up; protection also stops poison
let s = resolveNight(game(['werewolf', 'doctor', 'witch', 'villager', 'villager'], {
  nightActions: [act('werewolf', 'kill', 'p3'), act('witch', 'save', 'p3'), act('witch', 'poison', 'p4')],
}));
ok(dead(s).join() === 'p4', 'save beats bite, poison kills');
ok(!s.witchPotions!.heal && !s.witchPotions!.poison, 'both potions used');
s = resolveNight(game(['werewolf', 'doctor', 'witch', 'villager', 'villager'], {
  nightActions: [act('doctor', 'heal', 'p4'), act('witch', 'poison', 'p4')],
}));
ok(dead(s).length === 0 && !s.witchPotions!.poison, 'protection stops poison, potion still spent');
s = resolveNight(game(['werewolf', 'doctor', 'villager', 'villager'], {
  nightActions: [act('werewolf', 'kill', 'p2'), act('doctor', 'heal', 'p2')],
}));
ok(dead(s).length === 0, 'doctor saves the bitten player');

// Hunter killed at night holds the game open, then shoots the last wolf
let g = game(['werewolf', 'hunter', 'villager'], { nightActions: [act('werewolf', 'kill', 'p1')] });
g = { ...g, ...resolveNight(g) };
ok(g.pendingHunters.join() === 'p1', 'hunter pending after night death');
ok(checkWinCondition(g.players) === 'werewolves', 'without the shot wolves would win');
g = { ...g, ...hunterShot(g, 'p0') };
ok(g.pendingHunters.length === 0 && checkWinCondition(g.players) === 'villagers', 'hunter shot wins it');

// Wolf cub lynched -> two kills next night, bonus used up after that night
g = game(['werewolf', 'wolf-cub', 'villager', 'villager', 'villager', 'seer']);
g = { ...g, ...lynch(g, 'p1') };
ok(g.wolfExtraKill && g.lynchedToday, 'cub death grants extra kill');
g = { ...g, ...resolveNight({ ...g, nightActions: [act('werewolf', 'kill', 'p2'), act('werewolf', 'kill', 'p3')] }) };
ok(dead(g).join() === 'p1,p2,p3' && !g.wolfExtraKill, 'two bites land, bonus consumed');

// Target rules
const ps = game(['werewolf', 'wolf-cub', 'bodyguard', 'villager']).players;
ok(nightCandidates('werewolf', ps, []).map(p => p.id).join() === 'p2,p3', 'wolves cannot bite wolves');
ok(nightCandidates('bodyguard', ps, [act('bodyguard', 'protect', 'p3')]).map(p => p.id).join() === 'p0,p1',
  'bodyguard: not self, not last night target');

// Every recommended setup is legal and survives the first night kill
for (let n = 5; n <= 20; n++) {
  const roles = getRecommendedRoles(n);
  ok(roleSetupError(roles, n) === null, `recommended ${n} is legal`);
  const firstVictim = roles.findIndex(r => r === 'villager' || r === 'seer');
  const after = game(roles).players.map((p, i) => (i === firstVictim ? { ...p, status: 'dead' } : p));
  ok(checkWinCondition(after) === null, `recommended ${n} survives night 1`);
}

// Huntress: one shot per game, blocked by protection like any night kill
g = game(['werewolf', 'huntress', 'doctor', 'villager', 'villager'], { nightActions: [act('huntress', 'shoot', 'p3')] });
g = { ...g, ...resolveNight(g) };
ok(dead(g).join() === 'p3' && g.huntressShotUsed, 'huntress shot lands and is used up');
ok(dead(resolveNight(game(['werewolf', 'huntress', 'doctor', 'villager', 'villager'], {
  nightActions: [act('huntress', 'shoot', 'p3'), act('doctor', 'heal', 'p3')],
}))).length === 0, 'protection stops the huntress');

// Tough Guy: bitten -> alive through the next day, dies at the following dawn (once)
g = game(['werewolf', 'tough-guy', 'villager', 'villager', 'seer'], { nightActions: [act('werewolf', 'kill', 'p1')] });
g = { ...g, ...resolveNight(g) };
ok(dead(g).length === 0 && g.toughGuyDoomed.join() === 'p1', 'tough guy survives the bite night');
g = { ...g, ...resolveNight({ ...g, nightActions: [act('doctor', 'heal', 'p1')] }) };
ok(dead(g).join() === 'p1' && g.eliminatedLastNight.join() === 'p1' && g.toughGuyDoomed.length === 0, 'tough guy dies next dawn, protection no help');
g = game(['werewolf', 'tough-guy', 'villager', 'villager', 'seer'], { toughGuyDoomed: ['p1'] });
g = { ...g, ...lynch(g, 'p1') };
g = { ...g, ...resolveNight(g) };
ok(g.eliminatedLastNight.length === 0, 'doomed tough guy lynched first is not reported again');

// Doppelganger: picks night 1, becomes the picked role (and team) when that player dies
g = game(['doppelganger', 'werewolf', 'villager', 'villager', 'seer', 'villager'], { nightActions: [act('doppelganger', 'copy', 'p1')] });
g = { ...g, ...resolveNight(g) };
ok(g.doppelgangers.p0 === 'p1' && g.players[0].role === 'doppelganger', 'doppelganger linked');
g = { ...g, ...lynch(g, 'p1') };
ok(g.players[0].role === 'werewolf' && checkWinCondition(g.players) === null, 'doppelganger became the werewolf');

// Tanner: voted out -> tanner wins; bitten -> just dead
g = game(['tanner', 'werewolf', 'villager', 'villager', 'seer']);
ok(lynch(g, 'p0').winner === 'tanner', 'tanner wins when voted out');
ok(resolveNight({ ...g, nightActions: [act('werewolf', 'kill', 'p0')] }).winner === undefined, 'tanner bitten does not win');
ok(checkWinCondition(game(['tanner', 'werewolf']).players) === 'werewolves', 'tanner counts as non-wolf for parity');

console.log('game-data rules: all checks passed');
