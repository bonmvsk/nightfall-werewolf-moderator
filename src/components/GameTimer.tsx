
import { useEffect, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw } from "lucide-react";

interface GameTimerProps {
  phase: "day" | "night";
}

const GameTimer = ({ phase }: GameTimerProps) => {
  const { gameState, timerSettings, startTimer, stopTimer, resetTimer, updateTimerSettings } = useGame();
  
  const [editingTime, setEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState("");
  
  const timeRemaining = phase === "day" ? gameState.dayTimeRemaining : gameState.nightTimeRemaining;
  const isActive = phase === "day" ? gameState.dayTimerActive : gameState.nightTimerActive;
  
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  const handleStartStop = () => {
    if (isActive) {
      stopTimer(phase);
    } else {
      startTimer(phase);
    }
  };
  
  const handleReset = () => {
    resetTimer(phase);
  };
  
  const handleEditClick = () => {
    setEditingTime(true);
    setTimeInput(String(phase === "day" ? timerSettings.day : timerSettings.night));
  };
  
  const handleSaveTime = () => {
    const newTime = parseInt(timeInput, 10);
    if (!isNaN(newTime) && newTime > 0) {
      if (phase === "day") {
        updateTimerSettings({ day: newTime });
      } else {
        updateTimerSettings({ night: newTime });
      }
      setEditingTime(false);
    }
  };
  
  return (
    <div className="glass-card p-4 rounded-lg w-full md:w-64">
      <h3 className="text-lg font-semibold mb-3 capitalize">{phase} Phase Timer</h3>
      
      {editingTime ? (
        <div className="flex items-center space-x-2 mb-4">
          <Input
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            type="number"
            min="1"
            className="bg-night-dark border-moonlight/20"
          />
          <Button size="sm" onClick={handleSaveTime}>Save</Button>
        </div>
      ) : (
        <div className="text-3xl font-bold mb-4 flex items-center justify-between">
          <span>
            {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
          </span>
          <Button variant="ghost" size="sm" onClick={handleEditClick}>
            Edit
          </Button>
        </div>
      )}
      
      <div className="flex space-x-2">
        <Button 
          onClick={handleStartStop} 
          className={isActive ? "bg-moonlight-dark" : "bg-moonlight"}
          variant="default"
        >
          {isActive ? (
            <><Pause className="mr-2 h-4 w-4" /> Pause</>
          ) : (
            <><Play className="mr-2 h-4 w-4" /> Start</>
          )}
        </Button>
        
        <Button 
          onClick={handleReset} 
          variant="secondary"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  );
};

export default GameTimer;
