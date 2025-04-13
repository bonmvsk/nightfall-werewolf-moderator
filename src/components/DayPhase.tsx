
import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PlayerCard from "./PlayerCard";
import GameTimer from "./GameTimer";
import { Sun, AlertCircle, Moon, ShieldAlert, Beaker, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";

const DayPhase = () => {
  const { gameState, eliminatePlayer, startNightPhase, startTimer } = useGame();
  const { t } = useTranslation();
  
  useEffect(() => {
    startTimer('day');
  }, []);
  
  const witchActions = gameState.nightActions.filter(action => 
    action.roleId === 'witch' && action.actionType === 'poison'
  );

  const spellcasterActions = gameState.nightActions.filter(action =>
    action.roleId === 'spellcaster' && action.actionType === 'silence'
  );

  const protectionActions = gameState.nightActions.filter(action => 
    (action.roleId === 'bodyguard' && action.actionType === 'protect') || 
    (action.roleId === 'doctor' && action.actionType === 'heal')
  );

  const protectedPlayers = gameState.players.filter(player => 
    player.status === 'alive' && 
    player.protected && 
    player.targetedBy?.some(role => role === 'werewolf')
  );

  // Check if anyone was targeted by werewolves but protected
  const someoneWasProtected = protectedPlayers.length > 0;
  
  // Check if no one was eliminated during the night
  const noOneEliminated = gameState.eliminatedLastNight.length === 0;
  
  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <Sun className="mr-2 h-8 w-8 text-moonlight animate-pulse-slow" />
          {t('day.title')}
        </h1>
        <div className="flex items-center gap-4">
          <GameTimer phase="day" />
        </div>
      </div>
      
      {gameState.eliminatedLastNight.length > 0 ? (
        <Alert className="mb-4 bg-werewolf/20 border-werewolf/30 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('day.nightResults')}</AlertTitle>
          <AlertDescription>
            {gameState.eliminatedLastNight.length === 1 
              ? t('day.playerEliminated', { 
                  player: gameState.players.find(p => p.id === gameState.eliminatedLastNight[0])?.name 
                })
              : t('day.playersEliminated', { 
                  players: gameState.eliminatedLastNight.map(id => (
                    gameState.players.find(p => p.id === id)?.name
                  )).join(', ')
                })
            }
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-4 bg-blue-900/20 border-blue-700/30 text-blue-300">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t('day.nightResults')}</AlertTitle>
          <AlertDescription>
            {t('day.noOneEliminated')}
          </AlertDescription>
        </Alert>
      )}

      {witchActions.length > 0 && (
        <Alert className="mb-4 bg-purple-900/20 border-purple-700/30 text-purple-300">
          <Beaker className="h-4 w-4" />
          <AlertTitle>{t('roles.witch.name')}</AlertTitle>
          <AlertDescription>
            {t('day.witchPoison', {
              player: gameState.players.find(p => p.id === witchActions[0].targetId)?.name
            })}
          </AlertDescription>
        </Alert>
      )}

      {spellcasterActions.length > 0 && (
        <Alert className="mb-4 bg-indigo-900/20 border-indigo-700/30 text-indigo-300">
          <VolumeX className="h-4 w-4" />
          <AlertTitle>{t('roles.spellcaster.name')}</AlertTitle>
          <AlertDescription>
            {t('day.spellcasterSilence', {
              player: gameState.players.find(p => p.id === spellcasterActions[0].targetId)?.name
            })}
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="bg-night border-moonlight/20 mb-8">
        <CardHeader>
          <CardTitle>{t('day.villageDiscussion')}</CardTitle>
          <CardDescription>
            {t('day.discussionDescription')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gameState.players.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player}
                onVote={() => eliminatePlayer(player.id)}
                gamePhase="day"
                disabled={player.silenced}
              />
            ))}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center pt-6">
          <Button 
            onClick={startNightPhase}
            className="flex items-center"
          >
            <Moon className="mr-2 h-4 w-4" />
            {t('day.proceedToNight')}
          </Button>
        </CardFooter>
      </Card>
      
    </div>
  );
};

export default DayPhase;
