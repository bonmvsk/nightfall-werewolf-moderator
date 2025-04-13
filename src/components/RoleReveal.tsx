
import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, CheckCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ROLES } from "@/lib/game-data";
import { PlayerRole } from "@/lib/types";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const RoleReveal = () => {
  const { gameState, updatePlayerRole, startNightPhase } = useGame();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [revealedPlayers, setRevealedPlayers] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  
  const handleRoleView = (playerId: string) => {
    if (revealedPlayers.has(playerId)) {
      toast.error("You've already viewed this role");
      return;
    }
    
    setSelectedPlayerId(playerId);
    
    if (gameState.gameMode === 'system') {
      setRoleDialogOpen(true);
      // Mark as revealed after dialog is closed
      setRevealedPlayers(prev => new Set([...prev, playerId]));
    }
  };
  
  const handleCardModeRoleSelect = (playerId: string, role: PlayerRole) => {
    updatePlayerRole(playerId, role);
    setRevealedPlayers(prev => new Set([...prev, playerId]));
    toast.success("Role has been set");
  };
  
  const allPlayersRevealed = gameState.players.every(player => 
    revealedPlayers.has(player.id)
  );
  
  // When all players have revealed their roles, automatically redirect to game
  useEffect(() => {
    if (allPlayersRevealed && revealedPlayers.size > 0) {
      const timer = setTimeout(() => {
        handleStartGame();
      }, 1500); // Small delay to allow user to see that all roles are ready
      
      return () => clearTimeout(timer);
    }
  }, [allPlayersRevealed, revealedPlayers.size]);
  
  const handleStartGame = () => {
    startNightPhase();
    navigate("/");
    toast.success("The game begins!");
  };
  
  const selectedPlayer = selectedPlayerId ? 
    gameState.players.find(p => p.id === selectedPlayerId) : null;
  
  const isWerewolf = selectedPlayer?.role === 'werewolf';
  
  // Get available roles based on game settings and what's already assigned
  const getAvailableRoles = () => {
    // Start with all recommended roles
    const allRoles = Object.keys(ROLES) as PlayerRole[];
    
    if (gameState.gameMode === 'system') {
      // For system mode, return the assigned roles
      return allRoles;
    } else {
      // For card mode, filter out roles that have been assigned already
      const assignedRoles = gameState.players
        .filter(p => p.role && revealedPlayers.has(p.id))
        .map(p => p.role as PlayerRole);
      
      // Count how many of each role type we assigned
      const roleCounts: Record<string, number> = {};
      assignedRoles.forEach(role => {
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
      
      // Filter available roles based on what's been assigned
      return allRoles;
    }
  };
  
  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 animate-fade-in">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-moonlight-light">
        {gameState.gameMode === 'system' ? 'View Your Assigned Role' : 'Select Your Role Card'}
      </h1>
      
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>
            {gameState.gameMode === 'system' ? 'Role Reveal' : 'Role Selection'}
          </CardTitle>
          <CardDescription>
            {gameState.gameMode === 'system' 
              ? 'Each player should secretly view their assigned role.' 
              : 'Each player should select the role from their physical card.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameState.players.map(player => (
              <Card key={player.id} className={`relative ${revealedPlayers.has(player.id) ? 'opacity-75' : ''}`}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{player.name}</h3>
                    {revealedPlayers.has(player.id) && (
                      <p className="text-sm text-green-500 flex items-center gap-1 mt-1">
                        <CheckCheck className="h-4 w-4" />
                        {gameState.gameMode === 'system' ? 'Viewed' : 'Role selected'}
                      </p>
                    )}
                  </div>
                  
                  {gameState.gameMode === 'system' ? (
                    <Button 
                      onClick={() => handleRoleView(player.id)}
                      disabled={revealedPlayers.has(player.id)}
                      variant={revealedPlayers.has(player.id) ? "secondary" : "default"}
                      className="flex items-center gap-1"
                    >
                      {revealedPlayers.has(player.id) ? (
                        <>
                          <CheckCheck className="h-4 w-4" />
                          <span>Viewed</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          <span>View Role</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    revealedPlayers.has(player.id) ? (
                      <div className="text-sm bg-primary/20 px-3 py-1 rounded-full">
                        Role selected
                      </div>
                    ) : (
                      <Select onValueChange={(value) => handleCardModeRoleSelect(player.id, value as PlayerRole)}>
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRoles().map(role => (
                            <SelectItem key={role} value={role}>
                              {ROLES[role].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center mt-8">
        <Button
          onClick={handleStartGame}
          disabled={!allPlayersRevealed}
          size="lg"
          className="px-8 py-6 text-lg"
        >
          {allPlayersRevealed ? "Start Game" : "Waiting for all players..."}
        </Button>
      </div>
      
      {/* Role reveal dialog for system mode */}
      <Dialog open={roleDialogOpen} onOpenChange={(open) => {
        setRoleDialogOpen(open);
        if (!open && selectedPlayerId) {
          // When dialog closes, mark as revealed
          setRevealedPlayers(prev => new Set([...prev, selectedPlayerId]));
        }
      }}>
        <DialogContent className="bg-night border-moonlight/20 max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPlayer?.name}'s Role</DialogTitle>
          </DialogHeader>
          
          {selectedPlayer?.role && (
            <div className="flex flex-col items-center">
              <div className={`w-24 h-24 rounded-full mb-4 flex items-center justify-center
                ${isWerewolf ? 'bg-werewolf/20' : 'bg-blue-900/20'}`}>
                <div className={`w-16 h-16 rounded-full
                  ${isWerewolf ? 'bg-werewolf/50' : 'bg-blue-900/50'}`}>
                  {isWerewolf && (
                    <div className="wolf-eye top-4 left-4"></div>
                  )}
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">{ROLES[selectedPlayer.role].name}</h2>
              <p className="text-center text-muted-foreground mb-4">
                {ROLES[selectedPlayer.role].description}
              </p>
              
              <div className={`inline-block px-3 py-1 rounded-full text-sm
                ${isWerewolf ? 'bg-werewolf/30 text-red-300' : 'bg-blue-900/30 text-blue-300'}`}>
                Team: {isWerewolf ? 'Werewolves' : 'Village'}
              </div>
              
              <Button className="mt-6" onClick={() => setRoleDialogOpen(false)}>
                I understand my role
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleReveal;
