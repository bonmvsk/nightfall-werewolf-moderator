
import { Player } from "@/lib/types";
import { ROLES } from "@/lib/game-data";
import { useGame } from "@/contexts/GameContext";
import { useState } from "react";
import { UserIcon, Skull, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface PlayerCardProps {
  player: Player;
  onVote?: () => void;
  selectable?: boolean;
  selected?: boolean;
  gamePhase?: string;
  hideRoleButton?: boolean;
  disabled?: boolean;
}

const PlayerCard = ({ 
  player, 
  onVote, 
  selectable = false, 
  selected = false,
  gamePhase,
  hideRoleButton = false,
  disabled = false
}: PlayerCardProps) => {
  const { t } = useTranslation();
  const { gameState, viewRole } = useGame();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  
  const isWerewolf = player.role === 'werewolf';
  const roleData = player.role ? ROLES[player.role] : null;
  
  const handleViewRole = () => {
    if (gameState.gameMode === 'system') {
      setRoleDialogOpen(true);
    } else {
      viewRole(player.id);
    }
  };
  
  return (
    <>
      <div 
        className={`
          glass-card rounded-lg p-4 relative overflow-hidden
          ${player.status === 'dead' ? 'opacity-60' : ''}
          ${selectable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50' : ''}
          ${selected ? 'ring-2 ring-primary' : ''}
          transform transition-all duration-300 hover:scale-102
        `}
      >
        {/* Status indicators */}
        {player.status === 'dead' && (
          <div className="absolute top-0 right-0 m-2">
            <Skull className="h-5 w-5 text-red-500" />
          </div>
        )}
        
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-primary" />
          </div>
          
          <div className="flex-grow">
            <h3 className="text-lg font-bold">{player.name}</h3>
            {player.status === 'dead' && (
              <p className="text-sm text-red-400">{t('common.eliminated')}</p>
            )}
            {disabled && player.status === 'alive' && (
              <p className="text-sm text-amber-400">{t('common.silenced')}</p>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex-shrink-0">
            {gameState.gamePhase === 'setup' && !hideRoleButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleViewRole}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                <span>{t('common.role')}</span>
              </Button>
            )}
            
            {onVote && player.status === 'alive' && gameState.gamePhase === 'day' && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={onVote}
                disabled={disabled}
              >
                {t('common.eliminate')}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Role reveal dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="bg-night border-moonlight/20 max-w-md">
          <DialogHeader>
            <DialogTitle>{player.name}'s {t('common.role')}</DialogTitle>
          </DialogHeader>
          
          {player.role && (
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
              
              <h2 className="text-2xl font-bold mb-2">{t(`roles.${player.role}.name`)}</h2>
              <p className="text-center text-muted-foreground mb-4">
                {t(`roles.${player.role}.description`)}
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
    </>
  );
};

export default PlayerCard;
