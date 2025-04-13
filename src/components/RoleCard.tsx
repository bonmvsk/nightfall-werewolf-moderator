
import { ROLES } from "@/lib/game-data";
import { PlayerRole } from "@/lib/types";

interface RoleCardProps {
  role: PlayerRole;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
}

const RoleCard = ({ role, count, selected, onClick }: RoleCardProps) => {
  const roleData = ROLES[role];

  return (
    <div 
      className={`role-card ${selected ? 'ring-2 ring-primary/70' : ''}`}
      onClick={onClick}
      data-role-selected={selected ? "true" : "false"}
      data-role-count={count}
      data-role-name={role}
    >
      <div className="moon-glow" />
      
      <div className="flex items-start justify-between">
        <h3 className="role-title">{roleData.name}</h3>
        {count !== undefined && (
          <span className="bg-moonlight/30 text-white px-2 py-1 rounded-full text-xs">
            ×{count}
          </span>
        )}
      </div>
      
      <p className="role-description">{roleData.description}</p>
      
      {roleData.nightAction && (
        <div className="mt-2 text-xs text-moonlight-light italic">
          Night action: {roleData.nightAction}
        </div>
      )}
      
      <div className={`mt-2 text-xs inline-block px-2 py-1 rounded-full ${
        roleData.team === 'village' ? 'bg-blue-900/30 text-blue-300' : 'bg-werewolf/30 text-red-300'
      }`}>
        Team: {roleData.team === 'village' ? 'Village' : 'Werewolves'}
      </div>
    </div>
  );
};

export default RoleCard;
