import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { PlayerRole } from "@/lib/types";
import { getRecommendedRoles, roleSetupError, ROLES } from "@/lib/game-data";
import RoleCard from "./RoleCard";
import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

const RoleSelector = () => {
  const { t } = useTranslation();
  const { gameState, setRoleSetup } = useGame();
  const { roleSetup, players } = gameState;
  const error = roleSetupError(roleSetup, players.length);

  const count = (role: PlayerRole) => roleSetup.filter(r => r === role).length;

  const change = (role: PlayerRole, delta: 1 | -1) => {
    const next = [...roleSetup];
    if (delta > 0) next.push(role);
    else next.splice(next.indexOf(role), 1);
    setRoleSetup(next);
  };

  return (
    <div className="glass-card p-6 rounded-xl my-8">
      <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
        <h2 className="text-xl font-semibold">{t('setup.roleDistribution')}</h2>
        <Button variant="outline" onClick={() => setRoleSetup(getRecommendedRoles(players.length))}>
          {t('setup.useRecommended')}
        </Button>
      </div>
      <p className="mb-4 text-muted-foreground">
        {t('setup.customizeRolesDescription', { playerCount: players.length })}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(Object.keys(ROLES) as PlayerRole[]).map(role => (
          <div key={role} className="flex flex-col gap-2">
            <RoleCard role={role} count={count(role)} selected={count(role) > 0} />
            <div className="flex justify-center gap-2">
              <Button size="icon" variant="outline" disabled={count(role) === 0} onClick={() => change(role, -1)}>
                <Minus className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => change(role, 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-secondary rounded-lg">
        <div className="flex justify-between">
          <span>{t('setup.totalRolesSelected')}:</span>
          <span className={roleSetup.length !== players.length ? "text-red-400" : ""}>
            {roleSetup.length} / {players.length}
          </span>
        </div>
        {error && error !== 'needMorePlayers' && (
          <p className="mt-2 text-sm text-red-400">
            {t(`setup.${error}`, { count: players.length, selected: roleSetup.length })}
          </p>
        )}
      </div>
    </div>
  );
};

export default RoleSelector;
