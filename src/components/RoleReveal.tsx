
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
import { useTranslation } from "react-i18next";

const RoleReveal = () => {
  const { t } = useTranslation();
  const { gameState, updatePlayerRole, startNightPhase } = useGame();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [revealedPlayers, setRevealedPlayers] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  
  const handleRoleView = (playerId: string) => {
    if (revealedPlayers.has(playerId)) {
      toast.error(t('roleReveal.alreadyViewed'));
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
    toast.success(t('roleReveal.roleSet'));
  };
  
  const allPlayersRevealed = gameState.players.every(player => 
    revealedPlayers.has(player.id)
  );
  
  const handleStartGame = () => {
    startNightPhase();
    navigate("/");
    toast.success(t('roleReveal.gameBegins'));
  };
  
  const selectedPlayer = selectedPlayerId ? 
    gameState.players.find(p => p.id === selectedPlayerId) : null;
  
  const isWerewolf = selectedPlayer?.role === 'werewolf';
  
  const getAvailableRoles = () => {
    const allRoles = Object.keys(ROLES) as PlayerRole[];
    
    if (gameState.gameMode === 'system') {
      return allRoles;
    } else {
      const assignedRoles = gameState.players
        .filter(p => p.role && revealedPlayers.has(p.id))
        .map(p => p.role as PlayerRole);
      
      const roleCounts: Record<string, number> = {};
      assignedRoles.forEach(role => {
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
      
      return allRoles;
    }
  };
  
  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 animate-fade-in">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-moonlight-light">
        {gameState.gameMode === 'system' 
          ? t('roleReveal.viewAssignedRole') 
          : t('roleReveal.selectRoleCard')}
      </h1>
      
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>
            {gameState.gameMode === 'system' 
              ? t('roleReveal.roleReveal') 
              : t('roleReveal.roleSelection')}
          </CardTitle>
          <CardDescription>
            {gameState.gameMode === 'system' 
              ? t('roleReveal.secretlyViewRole') 
              : t('roleReveal.selectRoleFromCard')}
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
                        {gameState.gameMode === 'system' 
                          ? t('roleReveal.viewed') 
                          : t('roleReveal.roleSelected')}
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
                          <span>{t('roleReveal.viewed')}</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          <span>{t('roleReveal.viewRole')}</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    revealedPlayers.has(player.id) ? (
                      <div className="text-sm bg-primary/20 px-3 py-1 rounded-full">
                        {t('roleReveal.roleSelected')}
                      </div>
                    ) : (
                      <Select onValueChange={(value) => handleCardModeRoleSelect(player.id, value as PlayerRole)}>
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder={t('roleReveal.selectRole')} />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRoles().map(role => (
                            <SelectItem key={role} value={role}>
                              {t(`roles.${role}.name`)}
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
          {allPlayersRevealed 
            ? t('roleReveal.startGame') 
            : t('roleReveal.waitingForPlayers')}
        </Button>
      </div>
      
      <Dialog open={roleDialogOpen} onOpenChange={(open) => {
        setRoleDialogOpen(open);
        if (!open && selectedPlayerId) {
          setRevealedPlayers(prev => new Set([...prev, selectedPlayerId]));
        }
      }}>
        <DialogContent className="bg-night border-moonlight/20 max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPlayer?.name}'s {t('common.role')}</DialogTitle>
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
              
              <h2 className="text-2xl font-bold mb-2">{t(`roles.${selectedPlayer.role}.name`)}</h2>
              <p className="text-center text-muted-foreground mb-4">
                {t(`roles.${selectedPlayer.role}.description`)}
              </p>
              
              <div className={`inline-block px-3 py-1 rounded-full text-sm
                ${isWerewolf ? 'bg-werewolf/30 text-red-300' : 'bg-blue-900/30 text-blue-300'}`}>
                {t('common.team')}: {isWerewolf ? t('common.werewolves') : t('common.village')}
              </div>
              
              <Button className="mt-6" onClick={() => setRoleDialogOpen(false)}>
                {t('common.iUnderstandMyRole')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleReveal;
