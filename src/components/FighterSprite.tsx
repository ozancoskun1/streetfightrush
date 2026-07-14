import React, { useEffect, useState } from 'react';

interface FighterSpriteProps {
  characterId: string;
  name: string;
  action:
    | 'idle'
    | 'walk_left'
    | 'walk_right'
    | 'duck'
    | 'block'
    | 'punch'
  
    | 'kick'
    | 'special'
    | 'hit'
    | 'ko';
  color: string;
  accentColor: string;
  isPlayer: boolean;
  isFlashing?: boolean;
}

const CHARACTER_FOLDERS: Record<string, string> = {
  rookie: 'rookie_boxer',
  street_rookie: 'street_rookie',
  
  monk: 'monk_fighter',
  fast_kid: 'fast_kick_kid',
  iron_fist: 'iron_fist',
  tank_boxer: 'tank_brawler',
  shadow_fighter: 'shadow_fighter',
  muay_thai: 'muay_thai_king',
  street_ninja: 'street_ninja',
  dragon_warrior: 'dragon_warrior',
  crazy_clown: 'crazy_clown',
  cyber_puncher: 'cyber_puncher',
  samurai: 'samurai_fighter',
  wrestler: 'wrestler_beast',
  kung_fu: 'kung_fu_master',
  boxing_queen: 'boxing_queen',
  final_boss: 'final_boss',
  
};

function mapActionToFile(action: FighterSpriteProps['action']) {
  switch (action) {
    case 'punch':
      return 'punch';
 
    case 'kick':
      return 'kick';
    case 'special':
      return 'special';
    case 'duck':
    case 'block':
      return 'guard';
    case 'hit':
      return 'hit';
    case 'ko':
      return 'ko';
    default:
      return 'idle';
  }
}

export default function FighterSprite({
  characterId,
  name,
  action,
  isPlayer,
  isFlashing = false,
}: FighterSpriteProps) {
  const folder = CHARACTER_FOLDERS[characterId] || characterId;
  const mappedAction = mapActionToFile(action);

  // Senin dosya isimlerin: idle.png.jpg, punch.png.jpg vs.
  const spriteUrl = `/characters/${folder}/${mappedAction}.png`;

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [spriteUrl]);

  const isDucking = action === 'duck' || action === 'block';
  const isKo = action === 'ko';

  let animClass = '';
  if (action === 'idle') animClass = 'animate-[bounce_1.4s_infinite]';
 if (action === 'walk_left' || action === 'walk_right')animClass = 'animate-[bounce_0.5s_infinite]';
  if (action === 'hit') animClass = 'animate-[pulse_0.15s_infinite]';

  return (
    <div
      className={`relative flex flex-col items-center select-none pointer-events-none transition-all duration-75 ${
        isKo ? 'rotate-90 translate-y-12 opacity-80' : ''
      } ${animClass}`}
    >
      <div className="w-20 h-3 bg-black/45 rounded-full blur-[3px] absolute -bottom-1" />

      <div
        style={{
          filter: isFlashing ? 'brightness(2.8) contrast(1.4) saturate(1.4)' : 'none',
          transition: 'filter 0.1s ease-out',
        }}
        className={`flex flex-col items-center justify-end relative h-56 w-44 transition-transform ${
          isDucking ? 'scale-y-[0.82] origin-bottom' : 'scale-y-100'
        }`}
      >
        {!imgError ? (
          <img
            src={spriteUrl}
            alt={`${name} ${action}`}
            onError={() => setImgError(true)}
            className={`max-h-full max-w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] ${
              isPlayer ? '' : 'scale-x-[-1]'
            }`}
            draggable={false}
          />
        ) : (
          <div className="w-20 h-28 flex items-center justify-center rounded-xl bg-red-900/40 border border-red-500/40 text-white text-[10px] font-black text-center p-2">
            SPRITE<br />YOK
          </div>
        )}
      </div>
    </div>
  );
}