import { ROLES } from "@/lib/game-data";
import { PlayerRole } from "@/lib/types";
import { useTranslation } from "react-i18next";

interface RoleCardProps {
  role: PlayerRole;
  count?: number;
  selected?: boolean;
}

const RoleCard = ({ role, count, selected }: RoleCardProps) => {
  const { t, i18n } = useTranslation();
  const team = ROLES[role].team;
  const nightKey = `roles.${role}.nightAction`;

  return (
    <div className={`role-card ${selected ? 'ring-2 ring-primary/70' : ''}`}>
      <div className="moon-glow" />

      <div className="flex items-start justify-between">
        <h3 className="role-title">{t(`roles.${role}.name`)}</h3>
        {count !== undefined && (
          <span className="bg-moonlight/30 text-white px-2 py-1 rounded-full text-xs">
            ×{count}
          </span>
        )}
      </div>

      <p className="role-description">{t(`roles.${role}.description`)}</p>

      {i18n.exists(nightKey) && (
        <div className="mt-2 text-xs text-moonlight-light italic">
          {t('common.nightAction')}: {t(nightKey)}
        </div>
      )}

      <div className={`mt-2 text-xs inline-block px-2 py-1 rounded-full ${
        team === 'werewolves' ? 'bg-werewolf/30 text-red-300' : team === 'neutral' ? 'bg-amber-900/30 text-amber-300' : 'bg-blue-900/30 text-blue-300'
      }`}>
        {t('common.team')}: {t(`teams.${team}`)}
      </div>
    </div>
  );
};

export default RoleCard;
