import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PlayerCard from "./PlayerCard";
import GameTimer from "./GameTimer";
import { ROLES, getNightActionOrder } from "@/lib/game-data";
import { Moon, ArrowRight, Users, CheckCircle, XCircle, Sun } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Player } from "@/lib/types";

const NightPhase = () => {
  const { gameState, performNightAction, completeNightPhase, startTimer, stopTimer } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [activeRoles, setActiveRoles] = useState<string[]>([]);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [showAllPlayersDialog, setShowAllPlayersDialog] = useState(false);
  const [playerRoleDialog, setPlayerRoleDialog] = useState<{open: boolean, player: Player | null}>({
    open: false,
    player: null
  });
  const [seerResult, setSeerResult] = useState<{shown: boolean, isGood: boolean | null, playerName: string, actionTaken: boolean}>({
    shown: false,
    isGood: null,
    playerName: "",
    actionTaken: false
  });
  const [allRolesCompleted, setAllRolesCompleted] = useState(false);
  
  const currentRolePlayers = gameState.players.filter(
    p => p.role === activeRoles[currentRoleIndex] && p.status === 'alive'
  );
  
  const currentRoleData = activeRoles[currentRoleIndex] 
    ? ROLES[activeRoles[currentRoleIndex] as any] 
    : null;
  
  useEffect(() => {
    const playerRoles = gameState.players
      .filter(p => p.status === 'alive')
      .map(p => p.role)
      .filter(Boolean) as string[];
      
    const nightActionRoles = getNightActionOrder(playerRoles as any);
    setActiveRoles(nightActionRoles);
    
    if (nightActionRoles.length > 0) {
      setCurrentRoleIndex(0);
      startTimer('night');
    }
  }, []);
  
  const handleSelectPlayer = (playerId: string) => {
    if (activeRoles[currentRoleIndex] === 'seer' && seerResult.actionTaken) {
      return;
    }
    
    setSelectedPlayer(playerId);
    
    if (activeRoles[currentRoleIndex] === 'seer') {
      const selectedPlayerData = gameState.players.find(p => p.id === playerId);
      if (selectedPlayerData) {
        const playerRole = selectedPlayerData.role;
        const isGood = playerRole ? ROLES[playerRole].team === 'village' : true;
        setSeerResult({
          shown: true,
          isGood,
          playerName: selectedPlayerData.name,
          actionTaken: true
        });
      }
    } else {
      setSeerResult({ shown: false, isGood: null, playerName: "", actionTaken: false });
    }
  };
  
  const handleConfirmAction = () => {
    if (!selectedPlayer || !activeRoles[currentRoleIndex]) return;
    
    const currentRole = activeRoles[currentRoleIndex];
    let actionType = 'view';
    
    switch (currentRole) {
      case 'werewolf':
        actionType = 'kill';
        break;
      case 'doctor':
        actionType = 'heal';
        break;
      case 'bodyguard':
        actionType = 'protect';
        break;
      case 'witch':
        actionType = 'poison';
        break;
      case 'seer':
        actionType = 'view';
        break;
    }
    
    performNightAction({
      roleId: currentRole,
      roleName: ROLES[currentRole as any].name,
      targetId: selectedPlayer,
      actionType
    });
    
    setSeerResult(prev => ({ ...prev, shown: false }));
    
    if (currentRoleIndex < activeRoles.length - 1) {
      setCurrentRoleIndex(currentRoleIndex + 1);
      setSelectedPlayer(null);
    } else {
      setAllRolesCompleted(true);
      setSelectedPlayer(null);
    }
  };
  
  const handleSkipRole = () => {
    setSeerResult(prev => ({ ...prev, shown: false }));
    
    if (currentRoleIndex < activeRoles.length - 1) {
      setCurrentRoleIndex(currentRoleIndex + 1);
      setSelectedPlayer(null);
    } else {
      setAllRolesCompleted(true);
      setSelectedPlayer(null);
    }
  };
  
  const handleViewPlayerRole = (player: Player) => {
    setPlayerRoleDialog({
      open: true,
      player
    });
  };
  
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
  
  if (allRolesCompleted) {
    return (
      <div className="container mx-auto px-4 max-w-4xl py-8 animate-fade-in text-center">
        <Card className="bg-night border-moonlight/20">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center text-2xl">
              <Moon className="mr-2 h-6 w-6 text-moonlight" />
              Night Phase Complete
            </CardTitle>
            <CardDescription className="text-center">
              All night actions have been completed. Dawn approaches...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Button 
              onClick={completeNightPhase} 
              size="lg"
              className="flex items-center gap-2"
            >
              <Sun className="h-5 w-5" />
              Proceed to Day Phase
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
        <div className="flex items-center gap-4">
          <GameTimer phase="night" />
        </div>
      </div>
      
      <Card className="bg-night border-moonlight/20 mb-8">
        <CardHeader>
          <CardTitle>
            {currentRoleData?.name || "Unknown Role"}'s Turn
          </CardTitle>
          <CardDescription>
            {currentRoleData?.nightAction || "This role has no night action."}
            {activeRoles[currentRoleIndex] === 'seer' && seerResult.actionTaken && (
              <span className="text-yellow-400 block mt-1">
                You have already used your ability this night.
              </span>
            )}
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
          
          {activeRoles[currentRoleIndex] === 'seer' && seerResult.shown && (
            <div className="mb-6 p-4 rounded-lg border border-moonlight/30 bg-night-dark">
              <h3 className="text-lg font-semibold mb-2">Seer Result:</h3>
              <div className="flex items-center justify-center py-4">
                {seerResult.isGood ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                    <p className="text-center">
                      <span className="font-bold">{seerResult.playerName}</span> is <span className="text-green-500 font-bold">Good</span> (Village Team)
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <XCircle className="h-12 w-12 text-red-500 mb-2" />
                    <p className="text-center">
                      <span className="font-bold">{seerResult.playerName}</span> is <span className="text-red-500 font-bold">Bad</span> (Werewolf Team)
                    </p>
                  </div>
                )}
              </div>
            </div>
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
                      className={activeRoles[currentRoleIndex] === 'seer' && seerResult.actionTaken ? 'pointer-events-none opacity-50' : ''}
                    >
                      <PlayerCard 
                        player={player} 
                        selectable={!(activeRoles[currentRoleIndex] === 'seer' && seerResult.actionTaken)}
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
              disabled={(!selectedPlayer && currentRolePlayers.length > 0) || (activeRoles[currentRoleIndex] === 'seer' && !selectedPlayer)}
              className="flex items-center"
            >
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showAllPlayersDialog} onOpenChange={setShowAllPlayersDialog}>
        <DialogContent className="bg-night border-moonlight/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Active Players</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-2">
            {gameState.players
              .filter(p => p.status === 'alive')
              .map(player => (
                <div 
                  key={player.id}
                  onClick={() => {
                    handleViewPlayerRole(player);
                    setShowAllPlayersDialog(false);
                  }}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <PlayerCard player={player} selectable />
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog 
        open={playerRoleDialog.open} 
        onOpenChange={(open) => setPlayerRoleDialog({ ...playerRoleDialog, open })}
      >
        <DialogContent className="bg-night border-moonlight/20 max-w-md">
          <DialogHeader>
            <DialogTitle>{playerRoleDialog.player?.name}'s Role</DialogTitle>
          </DialogHeader>
          
          {playerRoleDialog.player?.role && (
            <div className="flex flex-col items-center">
              <div className={`w-24 h-24 rounded-full mb-4 flex items-center justify-center
                ${playerRoleDialog.player.role === 'werewolf' ? 'bg-werewolf/20' : 'bg-blue-900/20'}`}>
                <div className={`w-16 h-16 rounded-full
                  ${playerRoleDialog.player.role === 'werewolf' ? 'bg-werewolf/50' : 'bg-blue-900/50'}`}>
                  {playerRoleDialog.player.role === 'werewolf' && (
                    <div className="wolf-eye top-4 left-4"></div>
                  )}
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">
                {ROLES[playerRoleDialog.player.role].name}
              </h2>
              <p className="text-center text-muted-foreground mb-4">
                {ROLES[playerRoleDialog.player.role].description}
              </p>
              
              <div className={`inline-block px-3 py-1 rounded-full text-sm
                ${playerRoleDialog.player.role === 'werewolf' ? 'bg-werewolf/30 text-red-300' : 'bg-blue-900/30 text-blue-300'}`}>
                Team: {ROLES[playerRoleDialog.player.role].team === 'werewolves' ? 'Werewolves' : 'Village'}
              </div>
              
              <Button className="mt-6" onClick={() => setPlayerRoleDialog({ open: false, player: null })}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NightPhase;
