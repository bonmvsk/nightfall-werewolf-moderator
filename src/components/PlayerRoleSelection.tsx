
import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { PlayerRole } from "@/lib/types";
import { ROLES } from "@/lib/game-data";
import RoleCard from "./RoleCard";

const PlayerRoleSelection = () => {
  const { gameState, updatePlayerRole, completeRoleSelection } = useGame();
  const [selectedRole, setSelectedRole] = useState<PlayerRole | null>(null);
  
  // Get the current player who needs to select a role
  const currentPlayerIndex = gameState.players.findIndex(p => p.role === null);
  const currentPlayer = currentPlayerIndex >= 0 ? gameState.players[currentPlayerIndex] : null;
  
  // Get the selected roles so far
  const selectedRoles = gameState.players
    .filter(p => p.role !== null)
    .map(p => p.role as PlayerRole);
  
  // Get the role counts
  const selectedRoleCounts: Record<string, number> = {};
  selectedRoles.forEach(role => {
    if (role) {
      selectedRoleCounts[role] = (selectedRoleCounts[role] || 0) + 1;
    }
  });
  
  // Get available roles (all roles except those that have reached their max count)
  const availableRoles = Object.keys(ROLES).filter(role => {
    const roleId = role as PlayerRole;
    // Limit werewolves to 1/3 of players (rounded down)
    if (roleId === 'werewolf') {
      const maxWerewolves = Math.floor(gameState.players.length / 3);
      return (selectedRoleCounts[roleId] || 0) < maxWerewolves;
    }
    // For other roles, limit to a reasonable number
    const maxCount = roleId === 'villager' ? gameState.players.length : 2;
    return (selectedRoleCounts[roleId] || 0) < maxCount;
  }) as PlayerRole[];
  
  const handleRoleSelect = (role: PlayerRole) => {
    setSelectedRole(role);
  };
  
  const handleConfirm = () => {
    if (selectedRole && currentPlayer) {
      updatePlayerRole(currentPlayer.id, selectedRole);
      setSelectedRole(null);
    }
  };
  
  // Check if all players have selected roles
  const allRolesSelected = !gameState.players.some(p => p.role === null);
  
  // Count teams for summary
  const teamCounts = {
    village: gameState.players.filter(p => p.role && ROLES[p.role]?.team === 'village').length,
    werewolf: gameState.players.filter(p => p.role && ROLES[p.role]?.team === 'werewolf').length
  };
  
  return (
    <div className="container mx-auto px-4 max-w-3xl animate-fade-in">
      {allRolesSelected ? (
        <Card className="glass-card my-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              All Roles Selected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-secondary/50">
              <h3 className="font-semibold mb-2">Roles in this game:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(selectedRoleCounts).map(([role, count]) => (
                  <div key={role} className="flex items-center gap-2 bg-background/40 p-2 rounded">
                    <span className="font-medium">{ROLES[role as PlayerRole].name}</span>
                    <span className="ml-auto bg-primary/20 px-2 py-1 rounded-full text-xs">
                      ×{count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-secondary/50">
              <h3 className="font-semibold mb-2">Team Balance:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-900/30 p-3 rounded-lg text-center">
                  <div className="text-sm text-blue-300">Village Team</div>
                  <div className="text-2xl font-bold">{teamCounts.village}</div>
                </div>
                <div className="bg-werewolf/30 p-3 rounded-lg text-center">
                  <div className="text-sm text-red-300">Werewolf Team</div>
                  <div className="text-2xl font-bold">{teamCounts.werewolf}</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={completeRoleSelection}
                size="lg"
                className="px-8 py-6 text-lg"
              >
                Start Game
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : currentPlayer ? (
        <div className="my-6 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                {currentPlayer.name}'s Turn to Select a Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center mb-6 text-muted-foreground">
                Please pass the device to {currentPlayer.name} and let them select their role
              </p>
              
              <div className="flex justify-center">
                <div className="p-4 bg-secondary/40 rounded-lg flex items-center gap-3 mb-6">
                  <AlertCircle className="text-yellow-400" />
                  <p className="text-sm">Keep your selection private from other players!</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-3">Select your role:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {availableRoles.map(role => (
                  <div 
                    key={role}
                    onClick={() => handleRoleSelect(role)} 
                    className="cursor-pointer relative"
                  >
                    <RoleCard 
                      role={role} 
                      selected={selectedRole === role} 
                    />
                    {selectedRole === role && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-6 w-6 text-green-500 bg-black/40 rounded-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleConfirm}
                  disabled={!selectedRole}
                  className="px-6 py-5 text-base"
                  size="lg"
                >
                  Confirm Selection <ArrowRight className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex justify-center items-center min-h-[50vh]">
          <p className="text-xl">Loading player selection...</p>
        </div>
      )}
    </div>
  );
};

export default PlayerRoleSelection;
