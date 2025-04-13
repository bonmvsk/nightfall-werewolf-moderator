
import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PlayerCard from "./PlayerCard";
import GameTimer from "./GameTimer";
import { ROLES, getNightActionOrder } from "@/lib/game-data";
import { Moon, ArrowRight } from "lucide-react";

const NightPhase = () => {
  const { gameState, performNightAction, completeNightPhase, startTimer, stopTimer } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [activeRoles, setActiveRoles] = useState<string[]>([]);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  
  // Find players with the current night role
  const currentRolePlayers = gameState.players.filter(
    p => p.role === activeRoles[currentRoleIndex] && p.status === 'alive'
  );
  
  const currentRoleData = activeRoles[currentRoleIndex] 
    ? ROLES[activeRoles[currentRoleIndex] as any] 
    : null;
  
  // Set up active roles on component mount
  useEffect(() => {
    // Get all roles that have night actions
    const playerRoles = gameState.players
      .filter(p => p.status === 'alive')
      .map(p => p.role)
      .filter(Boolean) as string[];
      
    const nightActionRoles = getNightActionOrder(playerRoles as any);
    setActiveRoles(nightActionRoles);
    
    // Start with first role if available
    if (nightActionRoles.length > 0) {
      setCurrentRoleIndex(0);
      startTimer('night');
    }
  }, []);
  
  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayer(playerId);
  };
  
  const handleConfirmAction = () => {
    if (!selectedPlayer || !activeRoles[currentRoleIndex]) return;
    
    const currentRole = activeRoles[currentRoleIndex];
    let actionType = 'view'; // Default action
    
    // Determine action type based on role
    switch (currentRole) {
      case 'werewolf':
        actionType = 'kill';
        break;
      case 'doctor':
      case 'bodyguard':
        actionType = 'protect';
        break;
      case 'witch':
        // For simplicity, witch just poisons someone
        actionType = 'poison';
        break;
      case 'seer':
        actionType = 'view';
        break;
    }
    
    // Record the action
    performNightAction({
      roleId: currentRole,
      roleName: ROLES[currentRole as any].name,
      targetId: selectedPlayer,
      actionType
    });
    
    // Move to next role or complete if last
    if (currentRoleIndex < activeRoles.length - 1) {
      setCurrentRoleIndex(currentRoleIndex + 1);
      setSelectedPlayer(null);
    } else {
      // All roles have acted, complete night phase
      completeNightPhase();
      stopTimer('night');
    }
  };
  
  const handleSkipRole = () => {
    // Move to next role without performing action
    if (currentRoleIndex < activeRoles.length - 1) {
      setCurrentRoleIndex(currentRoleIndex + 1);
      setSelectedPlayer(null);
    } else {
      // All roles have acted, complete night phase
      completeNightPhase();
      stopTimer('night');
    }
  };
  
  // If no active roles, move directly to completion
  if (activeRoles.length === 0) {
    return (
      <div className="container mx-auto px-4 max-w-4xl py-8 animate-fade-in text-center">
        <Card className="bg-night border-moonlight/20">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center text-2xl">
              <Moon className="mr-2 h-6 w-6 text-moonlight" />
              Night Phase
            </CardTitle>
            <CardDescription className="text-center">
              No roles have night actions. Proceeding to day phase...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Button onClick={completeNightPhase} size="lg">
              Continue to Day Phase
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <Moon className="mr-2 h-8 w-8 text-moonlight animate-pulse-slow" />
          Night Phase
        </h1>
        <GameTimer phase="night" />
      </div>
      
      <Card className="bg-night border-moonlight/20 mb-8">
        <CardHeader>
          <CardTitle>
            {currentRoleData?.name || "Unknown Role"}'s Turn
          </CardTitle>
          <CardDescription>
            {currentRoleData?.nightAction || "This role has no night action."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex justify-between items-center">
            <span className="text-sm">
              Step {currentRoleIndex + 1} of {activeRoles.length}
            </span>
            
            <div className="flex items-center space-x-2">
              {activeRoles.map((role, index) => (
                <div 
                  key={role + index} 
                  className={`w-3 h-3 rounded-full ${
                    index === currentRoleIndex 
                      ? 'bg-primary animate-pulse-slow' 
                      : index < currentRoleIndex 
                        ? 'bg-muted' 
                        : 'bg-muted/30'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {currentRolePlayers.length > 0 ? (
            <div className="mb-6">
              <p className="text-sm mb-2">
                Players with this role:
              </p>
              <div className="flex flex-wrap gap-2">
                {currentRolePlayers.map(player => (
                  <span 
                    key={player.id} 
                    className="px-2 py-1 bg-secondary rounded-lg text-sm"
                  >
                    {player.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm mb-6">
              No players with this role are alive.
            </p>
          )}
          
          {currentRolePlayers.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mb-3">Select a target:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {gameState.players
                  .filter(p => p.status === 'alive')
                  .map(player => (
                    <div 
                      key={player.id} 
                      onClick={() => handleSelectPlayer(player.id)}
                    >
                      <PlayerCard 
                        player={player} 
                        selectable
                        selected={selectedPlayer === player.id}
                      />
                    </div>
                  ))}
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button 
              variant="secondary"
              onClick={handleSkipRole}
            >
              Skip
            </Button>
            
            <Button 
              onClick={handleConfirmAction}
              disabled={!selectedPlayer && currentRolePlayers.length > 0}
              className="flex items-center"
            >
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NightPhase;
