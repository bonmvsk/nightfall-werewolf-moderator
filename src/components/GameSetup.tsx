
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlayerCard from "./PlayerCard";
import RoleSelector from "./RoleSelector";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";

const GameSetup = () => {
  const navigate = useNavigate();
  const { gameState, addPlayer, removePlayer, setGameMode, startGame } = useGame();
  const [playerName, setPlayerName] = useState("");
  const { t } = useTranslation();
  
  const handleAddPlayer = () => {
    if (playerName.trim()) {
      addPlayer(playerName);
      setPlayerName("");
    } else {
      toast.error(t('setup.playerName'));
    }
  };
  
  const handleStartGame = () => {
    if (gameState.players.length < 5) {
      toast.error(t('setup.needMorePlayers'));
      return;
    }
    
    // For system mode, check if selected roles match player count
    if (gameState.gameMode === 'system') {
      // Get all selected roles from the DOM and count their quantities
      const selectedRoleElements = document.querySelectorAll('[data-role-selected="true"]');
      
      // Calculate total selected roles by summing all role counts
      let totalRolesCount = 0;
      selectedRoleElements.forEach(element => {
        const countStr = element.getAttribute('data-role-count');
        if (countStr) {
          totalRolesCount += parseInt(countStr, 10);
        }
      });
      
      if (totalRolesCount !== gameState.players.length) {
        toast.error(
          t('setup.rolesMismatch', { 
            count: gameState.players.length, 
            selected: totalRolesCount 
          })
        );
        return;
      }
    }
    
    startGame();
    navigate("/role-reveal");
  };
  
  return (
    <div className="container mx-auto px-4 max-w-4xl animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-moonlight-light">{t('setup.title')}</h1>
        <LanguageSelector />
      </div>
      
      {/* Players Card: Add players form and players list combined */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>{t('common.players')}</CardTitle>
          <CardDescription>{t('setup.addPlayers')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">{t('setup.addPlayers')}</h3>
            <div className="flex gap-2">
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={t('setup.playerName')}
                className="bg-night-dark border-moonlight/20"
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddPlayer();
                }}
              />
              <Button onClick={handleAddPlayer}>{t('common.add')}</Button>
            </div>
          </div>
          
          {gameState.players.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">
                {t('setup.playersList')} ({gameState.players.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameState.players.map(player => (
                  <div key={player.id} className="flex">
                    <div className="flex-grow">
                      <PlayerCard player={player} hideRoleButton={true} />
                    </div>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="ml-2 self-center"
                      onClick={() => removePlayer(player.id)}
                    >
                      &times;
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Game Settings Card: Game mode and role distribution combined */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>{t('setup.gameSettings')}</CardTitle>
          <CardDescription>{t('setup.gameMode')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">{t('setup.gameMode')}</h3>
            <Tabs 
              defaultValue={gameState.gameMode} 
              onValueChange={(value) => setGameMode(value as any)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="system">{t('setup.systemMode')}</TabsTrigger>
                <TabsTrigger value="cards">{t('setup.cardsMode')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="system" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('setup.systemMode')}</CardTitle>
                    <CardDescription>
                      {t('setup.systemDescription')}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>
              
              <TabsContent value="cards" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('setup.cardsMode')}</CardTitle>
                    <CardDescription>
                      {t('setup.cardsDescription')}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {gameState.players.length >= 5 && (
            <RoleSelector />
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 flex justify-center">
        <Button 
          onClick={handleStartGame}
          disabled={gameState.players.length < 5}
          size="lg"
          className="btn-primary px-8 py-6 text-lg"
        >
          {t('setup.startGame')}
        </Button>
      </div>
    </div>
  );
};

export default GameSetup;
