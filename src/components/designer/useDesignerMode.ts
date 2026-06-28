import { useState } from 'react';
import type { DesignerMode } from './types';

export const useDesignerMode = () => {
  const [designerMode, setDesignerMode] = useState<DesignerMode>('edit');

  return {
    designerMode,
    setDesignerMode,
  };
};
