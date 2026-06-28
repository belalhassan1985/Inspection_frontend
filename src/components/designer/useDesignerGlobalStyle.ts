import { useState } from 'react';
import type { DesignerStyleState } from './types';
import { DEFAULT_STYLE_STATE } from './types';

export const useDesignerGlobalStyle = () => {
  const [styleState, setStyleState] = useState<DesignerStyleState>(DEFAULT_STYLE_STATE);

  const updateStyle = <K extends keyof DesignerStyleState>(key: K, value: DesignerStyleState[K]) =>
    setStyleState((prev) => ({ ...prev, [key]: value }));

  return {
    styleState,
    setStyleState,
    updateStyle,
  };
};
