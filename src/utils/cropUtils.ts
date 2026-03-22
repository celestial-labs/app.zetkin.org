import React from 'react';

import { ImageContextCropState } from './types/zetkin';

export function cropToStyle(crop: ImageContextCropState): React.CSSProperties {
  const { height, width, x, y } = crop.croppedAreaPercentages;
  const posX = width >= 100 ? 50 : (x / (100 - width)) * 100;
  const posY = height >= 100 ? 50 : (y / (100 - height)) * 100;
  return {
    objectFit: 'cover',
    objectPosition: `${posX}% ${posY}%`,
    transform: `scale(${crop.zoom})`,
    transformOrigin: 'center',
  };
}
