import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Player, GameMode, PlayerRole, GameState, NightAction, TimerSettings
} from "@/lib/types";
import {
  DEFAULT_TIMER_SETTINGS, getRecommendedRoles, checkWinCondition, roleSetupError, shuffle,
  resolveNight, lynch, hunterShot
} from "@/lib/game-data";
import { toast } from "sonner";
import i18n from "@/i18n/i18n";

interface GameContextType {
  gameState: GameState;
  timerSettings: TimerSettings;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  setGameMode: (mode: GameMode) => void;
  setRoleSetup: (roles: PlayerRole[]) => void;
  startGame: () => void;
  resetGame: () => void;
  updatePlayerRole: (playerId: string, role: PlayerRole) => void;
  startNightPhase: () => void;
  performNightAction: (action: NightAction) => void;
  completeNightPhase: () => void;
  lynchPlayer: (playerId: string) => void;
  resolveHunterShot: (targetId: string | null) => void;
  updateTimerSettings: (settings: Partial<TimerSettings>) => void;
  startTimer: (phase: 'day' | 'night') => void;
  stopTimer: (phase: 'day' | 'night') => void;
  resetTimer: (phase: 'day' | 'night') => void;
}

const defaultGameState: GameState = {
  players: [],
  gamePhase: 'setup',
  gameMode: 'system',
  roleSetup: [],
  nightActions: [],
  previousNightActions: [],
  witchPotions: { heal: true, poison: true },
  huntressShotUsed: false,
  toughGuyDoomed: [],
  doppelgangers: {},
  wolfExtraKill: false,
  pendingHunters: [],
  lynchedToday: false,
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
            toast.warning(i18n.t('day.timeUp'));
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
            toast.warning(i18n.t('night.timeUp'));
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

  // Deaths only happen at dawn and during the day; wait for any hunter to shoot first.
  useEffect(() => {
    if (gameState.gamePhase !== 'day' || gameState.pendingHunters.length > 0) return;
    const winner = checkWinCondition(gameState.players);
    if (winner) {
      setGameState(prev => ({ ...prev, winner, gamePhase: 'result', dayTimerActive: false, nightTimerActive: false }));
    }
  }, [gameState.players, gameState.gamePhase, gameState.pendingHunters]);

  // Changing the player count resets roles to the recommendation for the new count.
  const withPlayers = (prev: GameState, players: Player[]): GameState => ({
    ...prev,
    players: players.map(p => ({ ...p, role: null })),
    roleSetup: getRecommendedRoles(players.length)
  });

  const addPlayer = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(i18n.t('setup.emptyName'));
      return;
    }

    if (gameState.players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(i18n.t('setup.duplicateName', { name: trimmed }));
      return;
    }

    setGameState(prev => withPlayers(prev, [...prev.players, { id: uuidv4(), name: trimmed, role: null, status: 'alive' }]));
  };

  const removePlayer = (id: string) => {
    setGameState(prev => withPlayers(prev, prev.players.filter(p => p.id !== id)));
  };

  const setGameMode = (mode: GameMode) => {
    setGameState(prevState => ({
      ...prevState,
      gameMode: mode
    }));
  };

  const setRoleSetup = (roles: PlayerRole[]) => {
    setGameState(prev => ({ ...prev, roleSetup: roles }));
  };

  const startGame = () => {
    const { players, roleSetup, gameMode } = gameState;
    const error = roleSetupError(roleSetup, players.length);
    if (error) {
      toast.error(i18n.t(`setup.${error}`, { count: players.length, selected: roleSetup.length }));
      return;
    }

    // Cards mode: roles are picked from the physical cards during reveal.
    const roles = gameMode === 'system' ? shuffle(roleSetup) : [];
    setGameState(prev => ({
      ...defaultGameState,
      gameMode: prev.gameMode,
      roleSetup: prev.roleSetup,
      players: prev.players.map((p, i) => ({ ...p, role: roles[i] ?? null, status: 'alive', silenced: false })),
      dayTimeRemaining: timerSettings.day,
      nightTimeRemaining: timerSettings.night,
      gamePhase: 'role-reveal'
    }));
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...defaultGameState,
      gameMode: prev.gameMode,
      roleSetup: prev.roleSetup,
      players: prev.players.map(p => ({ ...p, role: null, status: 'alive', silenced: false }))
    }));
  };

  const updatePlayerRole = (playerId: string, role: PlayerRole) => {
    setGameState(prevState => ({
      ...prevState,
      players: prevState.players.map(player =>
        player.id === playerId ? { ...player, role } : player
      )
    }));
  };

  const startNightPhase = () => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'night',
      nightActions: [],
      players: prev.players.map(p => ({ ...p, silenced: false })),
      dayTimerActive: false,
      nightTimerActive: false,
      nightTimeRemaining: timerSettings.night
    }));
  };

  const performNightAction = (action: NightAction) => {
    setGameState(prev => ({ ...prev, nightActions: [...prev.nightActions, action] }));
  };

  const completeNightPhase = () => {
    setGameState(prev => ({
      ...prev,
      ...resolveNight(prev),
      nightTimerActive: false,
      dayTimerActive: false,
      dayTimeRemaining: timerSettings.day
    }));
  };

  const lynchPlayer = (playerId: string) => {
    if (gameState.lynchedToday) return;
    const name = gameState.players.find(p => p.id === playerId)?.name;
    setGameState(prev => ({ ...prev, ...lynch(prev, playerId) }));
    toast.warning(i18n.t('day.lynched', { player: name }));
  };

  const resolveHunterShot = (targetId: string | null) => {
    setGameState(prev => ({ ...prev, ...hunterShot(prev, targetId) }));
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

  return (
    <GameContext.Provider value={{
      gameState,
      timerSettings,
      addPlayer,
      removePlayer,
      setGameMode,
      setRoleSetup,
      startGame,
      resetGame,
      updatePlayerRole,
      startNightPhase,
      performNightAction,
      completeNightPhase,
      lynchPlayer,
      resolveHunterShot,
      updateTimerSettings,
      startTimer,
      stopTimer,
      resetTimer
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
