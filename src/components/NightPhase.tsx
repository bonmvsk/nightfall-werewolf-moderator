import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PlayerCard from "./PlayerCard";
import GameTimer from "./GameTimer";
import { ROLES, getNightActionOrder, isWolf, nightCandidates } from "@/lib/game-data";
import { Moon, ArrowRight, CheckCircle, XCircle, Sun, HeartPulse, FlaskConical } from "lucide-react";
import { useTranslation } from "react-i18next";

const NightPhase = () => {
  const { t } = useTranslation();
  const { gameState, performNightAction, completeNightPhase, startTimer } = useGame();
  const { players, nightActions, previousNightActions, witchPotions, wolfExtraKill, huntressShotUsed, doppelgangers } = gameState;
  const alive = players.filter(p => p.status === 'alive');

  // Wake order is fixed at dusk; deaths resolve at dawn, so everyone alive now gets their turn.
  // Dead roles stay in as fake calls so the table can't tell who is gone.
  const [steps] = useState(() => getNightActionOrder(players, doppelgangers));
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [saveTarget, setSaveTarget] = useState<string | null>(null);

  useEffect(() => {
    if (steps.length > 0) startTimer('night');
  }, []);

  const done = stepIndex >= steps.length;
  const name = (id: string) => players.find(p => p.id === id)?.name;

  if (done) {
    return (
      <div className="container mx-auto px-4 max-w-4xl py-8 animate-fade-in text-center">
        <Card className="bg-night border-moonlight/20">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center text-2xl">
              <Moon className="mr-2 h-6 w-6 text-moonlight" />
              {t('night.nightComplete')}
            </CardTitle>
            <CardDescription className="text-center">
              {steps.length ? t('night.allActionsCompleted') : t('night.noRolesWithNightActions')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Button onClick={completeNightPhase} size="lg" className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              {t('night.proceedToDay')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { role, fake } = steps[stepIndex];
  const holders = alive.filter(p => (role === 'werewolf' ? isWolf(p.role) : p.role === role));
  const candidateIds = new Set(nightCandidates(role, players, previousNightActions).map(p => p.id));
  const maxPicks = role === 'werewolf' && wolfExtraKill ? 2 : 1;
  const seerLocked = role === 'seer' && selected.length > 0; // one look, no peeking at a second player
  const optional = fake || role === 'witch' || role === 'huntress'; // may pass without picking
  const canPick = !fake && (role === 'witch' ? witchPotions.poison : role === 'huntress' ? !huntressShotUsed : true);
  const wolfVictims = nightActions.filter(a => a.actionType === 'kill').map(a => a.targetId);

  const togglePlayer = (id: string) => {
    if (!canPick || seerLocked || !candidateIds.has(id)) return;
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      return maxPicks === 1 ? [id] : [...prev, id].slice(-maxPicks);
    });
  };

  const nextStep = () => {
    setSelected([]);
    setSaveTarget(null);
    setStepIndex(i => i + 1);
  };

  const confirm = () => {
    if (saveTarget) performNightAction({ roleId: 'witch', targetId: saveTarget, actionType: 'save' });
    selected.forEach(targetId => performNightAction({ roleId: role, targetId, actionType: ROLES[role].night! }));
    nextStep();
  };

  const seerTarget = role === 'seer' ? players.find(p => p.id === selected[0]) : undefined;

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <h1 className="text-3xl font-bold flex items-center">
          <Moon className="mr-2 h-8 w-8 text-moonlight animate-pulse-slow" />
          {t('night.title')}
        </h1>
        <GameTimer phase="night" />
      </div>

      {alive.filter(p => doppelgangers[p.id] && p.role !== 'doppelganger').map(p => (
        <p key={p.id} className="mb-4 text-sm text-amber-400">
          {t('night.doppelChanged', { player: p.name, role: t(`roles.${p.role}.name`) })}
        </p>
      ))}

      <Card className="bg-night border-moonlight/20 mb-8">
        <CardHeader>
          <CardTitle>{t('night.wakeUpMessage', { role: t(`roles.${role}.name`) })}</CardTitle>
          <CardDescription>
            {fake ? (
              <span className="block text-amber-400">{t('night.fakeCall')}</span>
            ) : (<>
            {t(`roles.${role}.nightAction`)}
            <span className="block mt-1 text-muted-foreground">
              {t('night.holders', {
                names: holders.map(p => (doppelgangers[p.id] ? `${p.name} ${t('night.doppelMarker')}` : p.name)).join(', ')
              })}
            </span>
            {role === 'huntress' && huntressShotUsed && (
              <span className="block mt-1 text-amber-400">{t('night.huntressUsed')}</span>
            )}
            {role === 'werewolf' && wolfExtraKill && (
              <span className="block mt-1 text-red-400">{t('night.extraKill')}</span>
            )}
            </>)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex justify-between items-center">
            <span className="text-sm">
              {t('night.stepProgress', { current: stepIndex + 1, total: steps.length })}
            </span>
            <div className="flex items-center space-x-2">
              {steps.map((s, i) => (
                <div
                  key={s.role}
                  className={`w-3 h-3 rounded-full ${
                    i === stepIndex ? 'bg-primary animate-pulse-slow' : i < stepIndex ? 'bg-muted' : 'bg-muted/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {role === 'witch' && !fake && (
            <div className="mb-6 p-4 rounded-lg border border-moonlight/30 bg-night-dark space-y-3">
              <p className="flex items-center gap-2 font-semibold">
                <HeartPulse className="h-5 w-5 text-green-400" />
                {wolfVictims.length
                  ? t('night.witchAttacked', { players: wolfVictims.map(name).join(', ') })
                  : t('night.witchNoAttack')}
              </p>
              {witchPotions.heal ? (
                <div className="flex flex-wrap gap-2">
                  {wolfVictims.map(id => (
                    <Button
                      key={id}
                      variant={saveTarget === id ? 'default' : 'outline'}
                      onClick={() => setSaveTarget(saveTarget === id ? null : id)}
                    >
                      {t('night.witchSave', { player: name(id) })}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('night.healUsed')}</p>
              )}
              <p className="flex items-center gap-2 font-semibold pt-2">
                <FlaskConical className="h-5 w-5 text-purple-400" />
                {witchPotions.poison ? t('night.witchPoisonPick') : t('night.poisonUsed')}
              </p>
            </div>
          )}

          {seerTarget && (
            <div className="mb-6 p-4 rounded-lg border border-moonlight/30 bg-night-dark">
              <h3 className="text-lg font-semibold mb-2">{t('night.seerResult')}:</h3>
              <div className="flex flex-col items-center py-4">
                {isWolf(seerTarget.role) ? (
                  <XCircle className="h-12 w-12 text-red-500 mb-2" />
                ) : (
                  <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                )}
                <p className="text-center">
                  <span className="font-bold">{seerTarget.name}</span>{' '}
                  {isWolf(seerTarget.role) ? t('night.isBad') : t('night.isGood')}
                </p>
              </div>
            </div>
          )}

          {canPick && (
            <>
              <h3 className="text-lg font-semibold mb-3">
                {t('night.selectTarget')}{maxPicks > 1 && ` (${selected.length}/${maxPicks})`}:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {alive.map(player => {
                  const pickable = candidateIds.has(player.id) && !seerLocked;
                  return (
                    <div
                      key={player.id}
                      onClick={() => togglePlayer(player.id)}
                      className={pickable || selected.includes(player.id) ? '' : 'pointer-events-none opacity-40'}
                    >
                      <PlayerCard player={player} selectable={pickable} selected={selected.includes(player.id)} />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={nextStep}>
              {t('common.skip')}
            </Button>
            <Button
              onClick={confirm}
              disabled={!optional && selected.length === 0}
              className="flex items-center"
            >
              {t('common.continue')} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NightPhase;
