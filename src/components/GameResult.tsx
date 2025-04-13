
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skull, Award } from "lucide-react";

const GameResult = () => {
  const { gameState, resetGame } = useGame();
  
  const werewolfPlayers = gameState.players.filter(p => p.role === 'werewolf');
  const villagePlayers = gameState.players.filter(p => p.role !== 'werewolf');
  
  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 animate-fade-in">
      <h1 className="text-4xl font-bold text-center mb-8">
        Game Over
      </h1>
      
      <Card className="bg-night/80 border-moonlight/50 mb-8 overflow-hidden relative">
        {gameState.winner === 'werewolves' ? (
          <div className="absolute inset-0 bg-werewolf/10 z-0"></div>
        ) : (
          <div className="absolute inset-0 bg-blue-900/10 z-0"></div>
        )}
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-center text-3xl flex items-center justify-center">
            <Award className={`mr-2 h-8 w-8 ${
              gameState.winner === 'werewolves' ? 'text-werewolf' : 'text-blue-400'
            }`} />
            {gameState.winner === 'werewolves' ? 'Werewolves Win!' : 'Villagers Win!'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <p className="text-center text-lg mb-6">
            {gameState.winner === 'werewolves' 
              ? 'The werewolves have outnumbered the villagers and taken over the village.'
              : 'The villagers have eliminated all the werewolves and saved their village!'
            }
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Werewolf Team */}
            <div>
              <h3 className="text-xl font-bold text-werewolf mb-3 flex items-center">
                <Skull className="mr-2 h-5 w-5" />
                Werewolf Team
              </h3>
              
              <div className="space-y-3">
                {werewolfPlayers.map(player => (
                  <div 
                    key={player.id} 
                    className="flex items-center justify-between bg-werewolf/20 border border-werewolf/30 rounded-md p-3"
                  >
                    <div>
                      <span className="font-semibold">{player.name}</span>
                    </div>
                    <Badge variant={player.status === 'alive' ? "default" : "destructive"}>
                      {player.status === 'alive' ? 'Survived' : 'Eliminated'}
                    </Badge>
                  </div>
                ))}
                
                {werewolfPlayers.length === 0 && (
                  <p className="text-muted-foreground">No werewolves in this game</p>
                )}
              </div>
            </div>
            
            {/* Village Team */}
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-3 flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Village Team
              </h3>
              
              <div className="space-y-2">
                {villagePlayers.map(player => (
                  <div 
                    key={player.id} 
                    className="flex items-center justify-between bg-blue-900/20 border border-blue-900/30 rounded-md p-3"
                  >
                    <div>
                      <span className="font-semibold">{player.name}</span>
                      <span className="text-xs ml-2 text-muted-foreground capitalize">
                        ({player.role})
                      </span>
                    </div>
                    <Badge variant={player.status === 'alive' ? "default" : "destructive"}>
                      {player.status === 'alive' ? 'Survived' : 'Eliminated'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="relative z-10 pt-6">
          <div className="w-full flex justify-center">
            <Button 
              onClick={resetGame}
              size="lg"
              className="px-8"
            >
              Play Again
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <div className="text-center text-muted-foreground">
        <p>Thank you for playing! Hope you enjoyed the game.</p>
      </div>
    </div>
  );
};

export default GameResult;
