
import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PlayerCard from "./PlayerCard";
import GameTimer from "./GameTimer";
import { Sun, AlertCircle, Moon, ShieldAlert, Flask } from "lucide-react";

const DayPhase = () => {
  const { gameState, eliminatePlayer, startNightPhase, startTimer } = useGame();
  
  // Start day timer
  useEffect(() => {
    startTimer('day');
  }, []);
  
  // Find witch actions if any
  const witchActions = gameState.nightActions.filter(action => 
    action.roleId === 'witch' && action.actionType === 'poison'
  );

  // Find protection actions
  const protectionActions = gameState.nightActions.filter(action => 
    (action.roleId === 'bodyguard' && action.actionType === 'protect') || 
    (action.roleId === 'doctor' && action.actionType === 'heal')
  );

  // Find protected players who survived werewolf attacks
  const protectedPlayers = gameState.players.filter(player => 
    player.status === 'alive' && 
    player.protected && 
    player.targetedBy?.some(role => role === 'werewolf')
  );
  
  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <Sun className="mr-2 h-8 w-8 text-yellow-500" />
          Day Phase
        </h1>
        <GameTimer phase="day" />
      </div>
      
      {gameState.eliminatedLastNight.length > 0 && (
        <Alert className="mb-4 bg-werewolf/20 border-werewolf/30 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Night Results</AlertTitle>
          <AlertDescription>
            {gameState.eliminatedLastNight.length === 1 
              ? <>
                  <span className="font-bold">
                    {gameState.players.find(p => p.id === gameState.eliminatedLastNight[0])?.name}
                  </span> was eliminated during the night.
                </>
              : <>
                  The following players were eliminated during the night: {' '}
                  {gameState.eliminatedLastNight.map(id => (
                    <span key={id} className="font-bold">{gameState.players.find(p => p.id === id)?.name}</span>
                  )).reduce((prev, curr, i) => (
                    i === 0 ? curr : <>{prev}, {curr}</>
                  ))}
                </>
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Show Witch's poison actions */}
      {witchActions.length > 0 && (
        <Alert className="mb-4 bg-purple-900/20 border-purple-700/30 text-purple-300">
          <Flask className="h-4 w-4" />
          <AlertTitle>Witch's Actions</AlertTitle>
          <AlertDescription>
            The Witch used a poison potion on{' '}
            <span className="font-bold">
              {gameState.players.find(p => p.id === witchActions[0].targetId)?.name}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Show protection results */}
      {protectedPlayers.length > 0 && (
        <Alert className="mb-4 bg-blue-900/20 border-blue-700/30 text-blue-300">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Protection Results</AlertTitle>
          <AlertDescription>
            {protectedPlayers.map((player, index) => (
              <div key={player.id}>
                <span className="font-bold">{player.name}</span> was protected from elimination!
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="bg-night border-moonlight/20 mb-8">
        <CardHeader>
          <CardTitle>Village Discussion</CardTitle>
          <CardDescription>
            The village must decide who to eliminate. Discuss and then vote.
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
            Proceed to Night Phase
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Surviving Players</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {gameState.players
            .filter(p => p.status === 'alive')
            .map(player => (
              <div 
                key={player.id}
                className="bg-night/50 border border-moonlight/10 rounded-md p-2 text-center"
              >
                {player.name}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DayPhase;
