
import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, CheckCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isWolf, roleSetupError, ROLES } from "@/lib/game-data";
import { Player, PlayerRole } from "@/lib/types";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const RoleReveal = () => {
  const { t } = useTranslation();
  const { gameState, updatePlayerRole, startNightPhase } = useGame();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [revealedPlayers, setRevealedPlayers] = useState<Set<string>>(new Set());
  
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
  
  // System mode: player has seen their role. Cards mode: a role has been picked (can still be changed).
  const isDone = (player: Player) =>
    gameState.gameMode === 'system' ? revealedPlayers.has(player.id) : !!player.role;
  const allPlayersRevealed = gameState.players.every(isDone);
  
  const handleStartGame = () => {
    if (gameState.gameMode === 'cards') {
      const roles = gameState.players.map(p => p.role as PlayerRole);
      const error = roleSetupError(roles, roles.length);
      if (error) {
        toast.error(t(`setup.${error}`, { count: roles.length, selected: roles.length }));
        return;
      }
    }
    startNightPhase();
    toast.success(t('roleReveal.gameBegins'));
  };
  
  const selectedPlayer = selectedPlayerId ? 
    gameState.players.find(p => p.id === selectedPlayerId) : null;
  
  const isWerewolf = isWolf(selectedPlayer?.role);
  
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
              <Card key={player.id} className={`relative ${isDone(player) ? 'opacity-75' : ''}`}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{player.name}</h3>
                    {isDone(player) && (
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
                      disabled={isDone(player)}
                      variant={isDone(player) ? "secondary" : "default"}
                      className="flex items-center gap-1"
                    >
                      {isDone(player) ? (
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
                    <Select
                      value={player.role ?? undefined}
                      onValueChange={(value) => updatePlayerRole(player.id, value as PlayerRole)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder={t('roleReveal.selectRole')} />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROLES) as PlayerRole[]).map(role => (
                          <SelectItem key={role} value={role}>
                            {t(`roles.${role}.name`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            <DialogTitle>{t('roleReveal.roleOf', { player: selectedPlayer?.name })}</DialogTitle>
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
                {t('common.team')}: {t(`teams.${ROLES[selectedPlayer.role].team}`)}
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
