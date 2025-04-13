
import { GameProvider } from "@/contexts/GameContext";
import GameSetup from "@/components/GameSetup";
import NightPhase from "@/components/NightPhase";
import DayPhase from "@/components/DayPhase";
import GameResult from "@/components/GameResult";
import PlayerRoleSelection from "@/components/PlayerRoleSelection";
import { useGame } from "@/contexts/GameContext";
import { MoonStar, Sun } from "lucide-react";

// Component to render the current game phase
const GamePhaseRenderer = () => {
  const { gameState } = useGame();
  
  // Check if we're in role selection mode
  if (gameState.roleSelectionActive) {
    return <PlayerRoleSelection />;
  }
  
  switch (gameState.gamePhase) {
    case 'setup':
      return <GameSetup />;
    case 'night':
      return <NightPhase />;
    case 'day':
      return <DayPhase />;
    case 'result':
      return <GameResult />;
    default:
      return <GameSetup />;
  }
};

// Component to render the background and phase indicator
const GameBackground = () => {
  const { gameState } = useGame();
  
  return (
    <div className="min-h-screen">
      {/* Phase indicator */}
      {gameState.gamePhase !== 'setup' && gameState.gamePhase !== 'result' && (
        <div className="fixed top-4 right-4 bg-black/40 backdrop-blur-sm p-2 rounded-full">
          {gameState.gamePhase === 'night' ? (
            <MoonStar className="h-6 w-6 text-moonlight animate-pulse-slow" />
          ) : (
            <Sun className="h-6 w-6 text-yellow-500 animate-pulse-slow" />
          )}
        </div>
      )}
      
      <GamePhaseRenderer />
    </div>
  );
};

const Index = () => {
  return (
    <GameProvider>
      <GameBackground />
    </GameProvider>
  );
};

export default Index;
