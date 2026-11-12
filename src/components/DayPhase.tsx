import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import PlayerCard from "./PlayerCard";
import GameTimer from "./GameTimer";
import { Sun, AlertCircle, Moon, ShieldAlert, VolumeX, Crosshair } from "lucide-react";
import { useTranslation } from "react-i18next";

const DayPhase = () => {
  const { gameState, lynchPlayer, resolveHunterShot, startNightPhase, startTimer } = useGame();
  const { t } = useTranslation();
  const { players, eliminatedLastNight, pendingHunters, lynchedToday } = gameState;
  const [lynchTarget, setLynchTarget] = useState<string | null>(null);
  const [shotTarget, setShotTarget] = useState<string | null>(null);

  useEffect(() => {
    startTimer('day');
  }, []);

  const name = (id: string | null) => players.find(p => p.id === id)?.name;
  const alive = players.filter(p => p.status === 'alive');
  const silenced = alive.filter(p => p.silenced);
  const hunter = pendingHunters[0] ?? null;

  const fireHunter = (targetId: string | null) => {
    resolveHunterShot(targetId);
    setShotTarget(null);
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <h1 className="text-3xl font-bold flex items-center">
          <Sun className="mr-2 h-8 w-8 text-moonlight animate-pulse-slow" />
          {t('day.title')}
        </h1>
        <GameTimer phase="day" />
      </div>

      {eliminatedLastNight.length > 0 ? (
        <Alert className="mb-4 bg-werewolf/20 border-werewolf/30 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('day.nightResults')}</AlertTitle>
          <AlertDescription>
            {t('day.playersEliminated', { players: eliminatedLastNight.map(name).join(', ') })}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-4 bg-blue-900/20 border-blue-700/30 text-blue-300">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t('day.nightResults')}</AlertTitle>
          <AlertDescription>{t('day.noOneEliminated')}</AlertDescription>
        </Alert>
      )}

      {silenced.length > 0 && (
        <Alert className="mb-4 bg-indigo-900/20 border-indigo-700/30 text-indigo-300">
          <VolumeX className="h-4 w-4" />
          <AlertTitle>{t('roles.spellcaster.name')}</AlertTitle>
          <AlertDescription>
            {t('day.silenced', { players: silenced.map(p => p.name).join(', ') })}
          </AlertDescription>
        </Alert>
      )}

      {hunter && (
        <Card className="mb-8 border-amber-500/50 bg-amber-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-amber-400" />
              {t('day.hunterTitle')}
            </CardTitle>
            <CardDescription>{t('day.hunterPrompt', { player: name(hunter) })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alive.map(player => (
                <div key={player.id} onClick={() => setShotTarget(player.id)}>
                  <PlayerCard player={player} selectable selected={shotTarget === player.id} />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => fireHunter(null)}>{t('day.hunterPass')}</Button>
            <Button variant="destructive" disabled={!shotTarget} onClick={() => fireHunter(shotTarget)}>
              {t('day.hunterShoot')}
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card className="bg-night border-moonlight/20 mb-8">
        <CardHeader>
          <CardTitle>{t('day.villageDiscussion')}</CardTitle>
          <CardDescription>
            {lynchedToday ? t('day.alreadyLynched') : t('day.discussionDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {players.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                onVote={() => setLynchTarget(player.id)}
                disabled={lynchedToday || !!hunter}
              />
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-center pt-6">
          <Button onClick={startNightPhase} disabled={!!hunter} className="flex items-center">
            <Moon className="mr-2 h-4 w-4" />
            {t('day.proceedToNight')}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={!!lynchTarget} onOpenChange={open => !open && setLynchTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('day.confirmLynch', { player: name(lynchTarget) })}</AlertDialogTitle>
            <AlertDialogDescription>{t('day.confirmLynchDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => lynchTarget && lynchPlayer(lynchTarget)}>
              {t('common.eliminate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DayPhase;
