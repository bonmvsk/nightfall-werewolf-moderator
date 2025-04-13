
import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlayerCard from "./PlayerCard";
import RoleSelector from "./RoleSelector";
import { toast } from "sonner";

const GameSetup = () => {
  const { gameState, addPlayer, removePlayer, setGameMode, startGame } = useGame();
  const [playerName, setPlayerName] = useState("");
  
  const handleAddPlayer = () => {
    if (playerName.trim()) {
      addPlayer(playerName);
      setPlayerName("");
    } else {
      toast.error("Please enter a player name");
    }
  };
  
  return (
    <div className="container mx-auto px-4 max-w-4xl animate-fade-in">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-moonlight-light">Werewolf Game Setup</h1>
      
      <div className="mb-8 glass-card p-6 rounded-xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Add Players</h2>
          <div className="flex gap-2">
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter player name"
              className="bg-night-dark border-moonlight/20"
              onKeyPress={(e) => {
                if (e.key === "Enter") handleAddPlayer();
              }}
            />
            <Button onClick={handleAddPlayer}>Add</Button>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-3">Game Mode</h2>
          <Tabs 
            defaultValue={gameState.gameMode} 
            onValueChange={(value) => setGameMode(value as any)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="system">System Random Assignment</TabsTrigger>
              <TabsTrigger value="cards">Player-drawn Cards</TabsTrigger>
            </TabsList>
            
            <TabsContent value="system" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Random Assignment</CardTitle>
                  <CardDescription>
                    The system will randomly assign roles to each player. 
                    Each player can view their role privately.
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
            
            <TabsContent value="cards" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Player-drawn Cards</CardTitle>
                  <CardDescription>
                    The system will only show which roles are in play.
                    Players use physical cards to determine roles.
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {gameState.players.length > 0 && (
        <div className="mb-8 glass-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Players ({gameState.players.length})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameState.players.map(player => (
              <div key={player.id} className="flex">
                <div className="flex-grow">
                  <PlayerCard player={player} />
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
      
      {gameState.players.length >= 5 && (
        <RoleSelector />
      )}
      
      <div className="mt-8 flex justify-center">
        <Button 
          onClick={startGame}
          disabled={gameState.players.length < 5}
          size="lg"
          className="btn-primary px-8 py-6 text-lg"
        >
          Start Game
        </Button>
      </div>
    </div>
  );
};

export default GameSetup;
