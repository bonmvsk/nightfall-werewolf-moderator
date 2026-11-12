
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skull, Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROLES } from "@/lib/game-data";
import { Player, Team } from "@/lib/types";

const GameResult = () => {
  const { gameState, resetGame } = useGame();
  const { t } = useTranslation();
  
  const onTeam = (team: Team) => gameState.players.filter(p => p.role && ROLES[p.role].team === team);
  const werewolfPlayers = onTeam('werewolves');
  const villagePlayers = onTeam('village');
  const neutralPlayers = onTeam('neutral');
  const winColor = { werewolves: 'text-werewolf', tanner: 'text-amber-400', villagers: 'text-blue-400' }[gameState.winner ?? 'villagers'];

  const playerRow = (player: Player, rowClass: string) => (
    <div key={player.id} className={`flex items-center justify-between border rounded-md p-3 ${rowClass}`}>
      <div>
        <span className="font-semibold">{player.name}</span>
        <span className="text-xs ml-2 text-muted-foreground">({t(`roles.${player.role}.name`)})</span>
      </div>
      <Badge variant={player.status === 'alive' ? "default" : "destructive"}>
        {player.status === 'alive' ? t('result.survived') : t('result.eliminated')}
      </Badge>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 animate-fade-in">
      <h1 className="text-4xl font-bold text-center mb-8">
        {t('result.title')}
      </h1>
      
      <Card className="bg-night/80 border-moonlight/50 mb-8 overflow-hidden relative">
        <div className={`absolute inset-0 z-0 ${
          gameState.winner === 'werewolves' ? 'bg-werewolf/10' : gameState.winner === 'tanner' ? 'bg-amber-900/10' : 'bg-blue-900/10'
        }`}></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-center text-3xl flex items-center justify-center">
            <Award className={`mr-2 h-8 w-8 ${winColor}`} />
            {t(`result.${gameState.winner}Win`)}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <p className="text-center text-lg mb-6">
            {t(`result.${gameState.winner}WinDescription`)}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Werewolf Team */}
            <div>
              <h3 className="text-xl font-bold text-werewolf mb-3 flex items-center">
                <Skull className="mr-2 h-5 w-5" />
                {t('result.werewolfTeam')}
              </h3>
              
              <div className="space-y-3">
                {werewolfPlayers.map(p => playerRow(p, 'bg-werewolf/20 border-werewolf/30'))}
                
                {werewolfPlayers.length === 0 && (
                  <p className="text-muted-foreground">{t('result.noWerewolves')}</p>
                )}
              </div>
            </div>
            
            {/* Village Team */}
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-3 flex items-center">
                <Award className="mr-2 h-5 w-5" />
                {t('result.villageTeam')}
              </h3>
              
              <div className="space-y-2">
                {villagePlayers.map(p => playerRow(p, 'bg-blue-900/20 border-blue-900/30'))}
              </div>
            </div>
          </div>

          {neutralPlayers.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-amber-400 mb-3 flex items-center">
                <Award className="mr-2 h-5 w-5" />
                {t('teams.neutral')}
              </h3>
              <div className="space-y-2">
                {neutralPlayers.map(p => playerRow(p, 'bg-amber-900/20 border-amber-900/30'))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="relative z-10 pt-6">
          <div className="w-full flex justify-center">
            <Button 
              onClick={resetGame}
              size="lg"
              className="px-8"
            >
              {t('common.playAgain')}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <div className="text-center text-muted-foreground">
        <p>{t('result.thanksMessage')}</p>
      </div>
    </div>
  );
};

export default GameResult;
