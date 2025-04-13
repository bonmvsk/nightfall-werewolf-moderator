import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { PlayerRole } from "@/lib/types";
import { getRecommendedRoles, ROLES } from "@/lib/game-data";
import RoleCard from "./RoleCard";

const RoleSelector = () => {
  const { gameState, setCustomRoles } = useGame();
  const [selectedRoles, setSelectedRoles] = useState<PlayerRole[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  // Get recommended roles based on player count
  const recommendedRoles = getRecommendedRoles(gameState.players.length);
  
  // Count occurrences of each role
  const countRoles = (roles: PlayerRole[]) => {
    const counts: Record<string, number> = {};
    roles.forEach(role => {
      counts[role] = (counts[role] || 0) + 1;
    });
    return counts;
  };
  
  const recommendedRoleCounts = countRoles(recommendedRoles);
  const selectedRoleCounts = countRoles(selectedRoles);
  
  // Initialize selected roles with recommendations
  useEffect(() => {
    setSelectedRoles(recommendedRoles);
  }, [gameState.players.length]);
  
  // Toggle a role selection
  const toggleRole = (role: PlayerRole) => {
    if (!isCustomizing) return;
    
    setSelectedRoles(prev => {
      // If removing a role
      if (selectedRoleCounts[role] && selectedRoleCounts[role] > 0) {
        // Remove one instance of the role
        const newRoles = [...prev];
        const roleIndex = newRoles.indexOf(role);
        if (roleIndex !== -1) {
          newRoles.splice(roleIndex, 1);
          // Add a villager to maintain count
          if (newRoles.length < gameState.players.length) {
            newRoles.push('villager');
          }
          return newRoles;
        }
      }
      
      // If adding a role
      if (prev.length >= gameState.players.length) {
        // Remove a villager if possible to make room for the new role
        const villagerIndex = prev.indexOf('villager');
        if (villagerIndex !== -1) {
          const newRoles = [...prev];
          newRoles.splice(villagerIndex, 1);
          newRoles.push(role);
          return newRoles;
        }
        // If no villagers to remove, try to keep the count the same
        const newRoles = [...prev];
        newRoles.pop(); // Remove the last role
        newRoles.push(role);
        return newRoles;
      } else {
        // Just add the role if we have room
        return [...prev, role];
      }
    });
  };
  
  const handleApplyCustomRoles = () => {
    let adjustedRoles = [...selectedRoles];
    const diff = gameState.players.length - adjustedRoles.length;
    
    if (diff > 0) {
      // Add villagers if we have too few roles
      for (let i = 0; i < diff; i++) {
        adjustedRoles.push('villager');
      }
    } else if (diff < 0) {
      // Remove roles if we have too many
      // Prioritize removing villagers first
      for (let i = 0; i < Math.abs(diff); i++) {
        const villagerIndex = adjustedRoles.indexOf('villager');
        if (villagerIndex !== -1) {
          adjustedRoles.splice(villagerIndex, 1);
        } else {
          // If no villagers to remove, just remove the last role
          adjustedRoles.pop();
        }
      }
    }
    
    setSelectedRoles(adjustedRoles);
    
    // Update recommendedRoleCounts with the adjusted roles
    const updatedRoleCounts = countRoles(adjustedRoles);
    
    // Apply the selected roles
    setCustomRoles(adjustedRoles);
    setIsCustomizing(false);
  };
  
  // List of all available roles
  const allRoles = Object.keys(ROLES) as PlayerRole[];
  
  return (
    <div className="glass-card p-6 rounded-xl my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Role Distribution</h2>
        {!isCustomizing ? (
          <Button onClick={() => setIsCustomizing(true)}>Customize Roles</Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedRoles(recommendedRoles);
                setIsCustomizing(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleApplyCustomRoles}>Apply</Button>
          </div>
        )}
      </div>
      
      {isCustomizing ? (
        <div>
          <p className="mb-4 text-muted-foreground">
            Click on roles to add or remove them. The total number of roles must match the number of players ({gameState.players.length}).
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {allRoles.map(role => (
              <div key={role} onClick={() => toggleRole(role)}>
                <RoleCard 
                  role={role} 
                  count={selectedRoleCounts[role] || 0}
                  selected={selectedRoleCounts[role] > 0}
                />
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <div className="flex justify-between">
              <span>Total roles selected:</span>
              <span className={selectedRoles.length !== gameState.players.length ? "text-red-400" : ""}>
                {selectedRoles.length} / {gameState.players.length}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(selectedRoleCounts).map(([role, count]) => (
            <RoleCard key={role} role={role as PlayerRole} count={count} selected={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
