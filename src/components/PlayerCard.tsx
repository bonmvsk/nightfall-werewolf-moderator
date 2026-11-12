import { Player } from "@/lib/types";
import { UserIcon, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface PlayerCardProps {
  player: Player;
  onVote?: () => void;
  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

const PlayerCard = ({
  player,
  onVote,
  selectable = false,
  selected = false,
  disabled = false
}: PlayerCardProps) => {
  const { t } = useTranslation();
  const alive = player.status === 'alive';

  return (
    <div
      className={`
        glass-card rounded-lg p-4 relative overflow-hidden
        ${!alive ? 'opacity-60' : ''}
        ${selectable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50' : ''}
        ${selected ? 'ring-2 ring-primary' : ''}
        transform transition-all duration-300 hover:scale-102
      `}
    >
      {!alive && (
        <div className="absolute top-0 right-0 m-2">
          <Skull className="h-5 w-5 text-red-500" />
        </div>
      )}

      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
          <UserIcon className="h-8 w-8 text-primary" />
        </div>

        <div className="flex-grow">
          <h3 className="text-lg font-bold">{player.name}</h3>
          {!alive && <p className="text-sm text-red-400">{t('common.eliminated')}</p>}
          {alive && player.silenced && <p className="text-sm text-amber-400">{t('common.silenced')}</p>}
        </div>

        {onVote && alive && (
          <Button variant="destructive" size="sm" onClick={onVote} disabled={disabled}>
            {t('common.eliminate')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
