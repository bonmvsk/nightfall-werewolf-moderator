
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { 
  Player, GameMode, GamePhase, PlayerRole, GameState, NightAction, TimerSettings
} from "@/lib/types";
import { DEFAULT_TIMER_SETTINGS, getRecommendedRoles, checkWinCondition } from "@/lib/game-data";
import { toast } from "sonner";

interface GameContextType {
  gameState: GameState;
  timerSettings: TimerSettings;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  setGameMode: (mode: GameMode) => void;
  startGame: () => void;
  resetGame: () => void;
  viewRole: (playerId: string) => void;
  performNightAction: (action: Partial<NightAction>) => void;
  completeNightPhase: () => void;
  startDayPhase: () => void;
  eliminatePlayer: (playerId: string) => void;
  startNightPhase: () => void;
  setCustomRoles: (roles: PlayerRole[]) => void;
  updateTimerSettings: (settings: Partial<TimerSettings>) => void;
  startTimer: (phase: 'day' | 'night') => void;
  stopTimer: (phase: 'day' | 'night') => void;
  resetTimer: (phase: 'day' | 'night') => void;
  updatePlayerRole: (playerId: string, role: PlayerRole) => void;
}

const defaultGameState: GameState = {
  players: [],
  gamePhase: 'setup',
  gameMode: 'system',
  currentNightRole: null,
  nightActions: [],
  dayTimeRemaining: DEFAULT_TIMER_SETTINGS.day,
  nightTimeRemaining: DEFAULT_TIMER_SETTINGS.night,
  dayTimerActive: false,
  nightTimerActive: false,
  eliminatedLastNight: [],
  winner: null
};

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>(DEFAULT_TIMER_SETTINGS);

  useEffect(() => {
    let interval: number | undefined;

    if (gameState.dayTimerActive) {
      interval = window.setInterval(() => {
        setGameState((prevState) => {
          const newTimeRemaining = prevState.dayTimeRemaining - 1;
          
          if (newTimeRemaining <= 0) {
            clearInterval(interval);
            toast.warning("Day phase time is up!");
            return {
              ...prevState,
              dayTimerActive: false,
              dayTimeRemaining: 0
            };
          }
          
          return {
            ...prevState,
            dayTimeRemaining: newTimeRemaining
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.dayTimerActive]);

  useEffect(() => {
    let interval: number | undefined;

    if (gameState.nightTimerActive) {
      interval = window.setInterval(() => {
        setGameState((prevState) => {
          const newTimeRemaining = prevState.nightTimeRemaining - 1;
          
          if (newTimeRemaining <= 0) {
            clearInterval(interval);
            toast.warning("Night phase time is up!");
            return {
              ...prevState,
              nightTimerActive: false,
              nightTimeRemaining: 0
            };
          }
          
          return {
            ...prevState,
            nightTimeRemaining: newTimeRemaining
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.nightTimerActive]);

  useEffect(() => {
    if (gameState.gamePhase !== 'setup') {
      const winner = checkWinCondition(gameState.players);
      if (winner) {
        setGameState(prev => ({ ...prev, winner, gamePhase: 'result' }));
      }
    }
  }, [gameState.players, gameState.gamePhase]);

  const addPlayer = (name: string) => {
    if (!name.trim()) {
      toast.error("Player name cannot be empty");
      return;
    }
    
    if (gameState.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error(`Player "${name}" already exists`);
      return;
    }
    
    const newPlayer: Player = {
      id: uuidv4(),
      name: name.trim(),
      role: null,
      status: 'alive',
    };
    
    setGameState(prevState => ({
      ...prevState,
      players: [...prevState.players, newPlayer]
    }));
    
    toast.success(`Added player: ${name}`);
  };

  const removePlayer = (id: string) => {
    setGameState(prevState => ({
      ...prevState,
      players: prevState.players.filter(p => p.id !== id)
    }));
    
    const playerName = gameState.players.find(p => p.id === id)?.name;
    if (playerName) {
      toast.info(`Removed player: ${playerName}`);
    }
  };

  const setGameMode = (mode: GameMode) => {
    setGameState(prevState => ({
      ...prevState,
      gameMode: mode
    }));
  };

  const setCustomRoles = (roles: PlayerRole[]) => {
    if (roles.length !== gameState.players.length) {
      toast.error("The number of roles must match the number of players");
      return;
    }
    
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
    
    setGameState(prevState => ({
      ...prevState,
      players: prevState.players.map((player, index) => ({
        ...player,
        role: shuffledRoles[index]
      }))
    }));
    
    toast.success("Custom roles have been assigned");
  };

  const startGame = () => {
    if (gameState.players.length < 5) {
      toast.error("You need at least 5 players to start the game");
      return;
    }
    
    if (gameState.gameMode === 'system' && !gameState.players.some(p => p.role)) {
      const recommendedRoles = getRecommendedRoles(gameState.players.length);
      const shuffledRoles = [...recommendedRoles].sort(() => Math.random() - 0.5);
      
      setGameState(prevState => ({
        ...prevState,
        players: prevState.players.map((player, index) => ({
          ...player,
          role: shuffledRoles[index]
        })),
        gamePhase: 'role-reveal',
        nightActions: [],
        eliminatedLastNight: []
      }));
    } else {
      setGameState(prevState => ({
        ...prevState,
        gamePhase: 'role-reveal',
        nightActions: [],
        eliminatedLastNight: []
      }));
    }
    
    toast.info("Time to reveal roles to players");
  };

  const resetGame = () => {
    setGameState({
      ...defaultGameState,
      players: gameState.players.map(p => ({
        ...p,
        role: null,
        status: 'alive',
        protected: false,
        poisoned: false,
        targetedBy: []
      }))
    });
    
    toast.info("Game has been reset");
  };

  const viewRole = (playerId: string) => {
    const player = gameState.players.find(p => p.id === playerId);
    
    if (player && player.role) {
      toast.info(`${player.name}'s role: ${player.role}`);
    } else {
      toast.error("Role not found");
    }
  };

  const performNightAction = (action: Partial<NightAction>) => {
    if (!action.roleId || !action.actionType) return;
    
    setGameState(prevState => ({
      ...prevState,
      nightActions: [...prevState.nightActions, action as NightAction],
      currentNightRole: null
    }));
    
    toast.info(`${action.roleName || 'Role'} action completed`);
  };

  const completeNightPhase = () => {
    let updatedPlayers = [...gameState.players];
    const eliminatedIds: string[] = [];
    
    // First, reset protection statuses from previous night
    updatedPlayers = updatedPlayers.map(player => ({
      ...player,
      protected: false,
      targetedBy: []
    }));
    
    // Apply protection from bodyguard and doctor
    gameState.nightActions.forEach(action => {
      if (action.targetId && (action.actionType === 'protect' || action.actionType === 'heal')) {
        const targetIndex = updatedPlayers.findIndex(p => p.id === action.targetId);
        if (targetIndex >= 0) {
          updatedPlayers[targetIndex] = {
            ...updatedPlayers[targetIndex],
            protected: true
          };
        }
      }
    });
    
    // Record werewolf targets
    gameState.nightActions.forEach(action => {
      if (action.targetId && action.actionType === 'kill' && action.roleId === 'werewolf') {
        const targetIndex = updatedPlayers.findIndex(p => p.id === action.targetId);
        if (targetIndex >= 0) {
          // Record that this player was targeted by werewolves
          updatedPlayers[targetIndex] = {
            ...updatedPlayers[targetIndex],
            targetedBy: [...(updatedPlayers[targetIndex].targetedBy || []), action.roleId]
          };
          
          // Only eliminate if not protected
          if (!updatedPlayers[targetIndex].protected) {
            eliminatedIds.push(action.targetId);
          }
        }
      }
    });
    
    // Apply witch's poison which bypasses protection
    gameState.nightActions.forEach(action => {
      if (action.targetId && action.actionType === 'poison' && action.roleId === 'witch') {
        // Witch's poison always kills, regardless of protection
        eliminatedIds.push(action.targetId);
      }
    });
    
    // Update player statuses based on elimination
    updatedPlayers = updatedPlayers.map(player => ({
      ...player,
      status: eliminatedIds.includes(player.id) ? 'dead' : player.status
    }));
    
    setGameState(prevState => ({
      ...prevState,
      players: updatedPlayers,
      gamePhase: 'day',
      eliminatedLastNight: eliminatedIds
    }));
    
    const winner = checkWinCondition(updatedPlayers);
    if (winner) {
      setGameState(prev => ({ ...prev, winner, gamePhase: 'result' }));
    } else {
      toast.info("Night phase is complete. The village awakens...");
    }
  };

  const startDayPhase = () => {
    startTimer('day');
    
    setGameState(prevState => ({
      ...prevState,
      gamePhase: 'day'
    }));
  };

  const eliminatePlayer = (playerId: string) => {
    const playerToEliminate = gameState.players.find(p => p.id === playerId);
    
    if (!playerToEliminate) {
      toast.error("Player not found");
      return;
    }
    
    setGameState(prevState => ({
      ...prevState,
      players: prevState.players.map(p => 
        p.id === playerId ? { ...p, status: 'dead' } : p
      )
    }));
    
    toast.warning(`${playerToEliminate.name} has been eliminated by the village`);
    
    if (playerToEliminate.role === 'hunter') {
      toast.info("The Hunter can eliminate one more player before dying");
    }
  };

  const startNightPhase = () => {
    resetTimer('night');
    
    setGameState(prevState => ({
      ...prevState,
      gamePhase: 'night',
      currentNightRole: 'seer',
      nightActions: []
    }));
    
    toast.info("Night falls on the village...");
  };

  const updateTimerSettings = (settings: Partial<TimerSettings>) => {
    setTimerSettings(prev => ({
      ...prev,
      ...settings
    }));
    
    if (settings.day !== undefined && !gameState.dayTimerActive) {
      setGameState(prev => ({ ...prev, dayTimeRemaining: settings.day }));
    }
    
    if (settings.night !== undefined && !gameState.nightTimerActive) {
      setGameState(prev => ({ ...prev, nightTimeRemaining: settings.night }));
    }
  };

  const startTimer = (phase: 'day' | 'night') => {
    if (phase === 'day') {
      setGameState(prev => ({ 
        ...prev, 
        dayTimerActive: true,
        dayTimeRemaining: prev.dayTimeRemaining > 0 ? prev.dayTimeRemaining : timerSettings.day
      }));
    } else {
      setGameState(prev => ({ 
        ...prev, 
        nightTimerActive: true,
        nightTimeRemaining: prev.nightTimeRemaining > 0 ? prev.nightTimeRemaining : timerSettings.night
      }));
    }
  };

  const stopTimer = (phase: 'day' | 'night') => {
    if (phase === 'day') {
      setGameState(prev => ({ ...prev, dayTimerActive: false }));
    } else {
      setGameState(prev => ({ ...prev, nightTimerActive: false }));
    }
  };

  const resetTimer = (phase: 'day' | 'night') => {
    if (phase === 'day') {
      setGameState(prev => ({ 
        ...prev, 
        dayTimerActive: false,
        dayTimeRemaining: timerSettings.day
      }));
    } else {
      setGameState(prev => ({ 
        ...prev, 
        nightTimerActive: false,
        nightTimeRemaining: timerSettings.night
      }));
    }
  };

  const updatePlayerRole = (playerId: string, role: PlayerRole) => {
    setGameState(prevState => ({
      ...prevState,
      players: prevState.players.map(player => 
        player.id === playerId ? { ...player, role } : player
      )
    }));
  };

  return (
    <GameContext.Provider value={{
      gameState,
      timerSettings,
      addPlayer,
      removePlayer,
      setGameMode,
      startGame,
      resetGame,
      viewRole,
      performNightAction,
      completeNightPhase,
      startDayPhase,
      eliminatePlayer,
      startNightPhase,
      setCustomRoles,
      updateTimerSettings,
      startTimer,
      stopTimer,
      resetTimer,
      updatePlayerRole
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
