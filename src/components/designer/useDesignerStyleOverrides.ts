import { useState } from 'react';
import type { DesignerStyleState, ElementStyleOverride } from './types';

type UseDesignerStyleOverridesParams = {
  selectedElementId: string | null;
  styleState: DesignerStyleState;
};

export const useDesignerStyleOverrides = ({
  selectedElementId,
  styleState,
}: UseDesignerStyleOverridesParams) => {
  const [elementStyleOverrides, setElementStyleOverrides] = useState<Record<string, ElementStyleOverride>>({});
  const [copiedStyle, setCopiedStyle] = useState<ElementStyleOverride | null>(null);

  const setStyleOverride = (key: string, patch: ElementStyleOverride) =>
    setElementStyleOverrides((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));

  const resetStyleOverride = (key: string) =>
    setElementStyleOverrides((prev) => { const next = { ...prev }; delete next[key]; return next; });

  const updateSelectedStyle = <K extends keyof DesignerStyleState>(key: K, value: DesignerStyleState[K]) => {
    if (!selectedElementId) return;
    setStyleOverride(selectedElementId, { [key]: value } as unknown as ElementStyleOverride);
  };

  const getSelectedStyleValue = <K extends keyof DesignerStyleState>(key: K): DesignerStyleState[K] => {
    if (selectedElementId && elementStyleOverrides[selectedElementId]?.[key] !== undefined) {
      return elementStyleOverrides[selectedElementId][key] as DesignerStyleState[K];
    }
    return styleState[key];
  };

  const selectedStyleOverride = selectedElementId ? elementStyleOverrides[selectedElementId] || {} : {};
  const hasSelectedStyleOverride = selectedElementId ? Boolean(elementStyleOverrides[selectedElementId]) : false;

  const resetSelectedStyle = () => {
    if (!selectedElementId) return;
    resetStyleOverride(selectedElementId);
  };

  const copySelectedStyle = () => {
    setCopiedStyle(selectedStyleOverride);
  };

  const pasteSelectedStyle = () => {
    if (!selectedElementId || !copiedStyle) return;
    setStyleOverride(selectedElementId, copiedStyle);
  };

  return {
    elementStyleOverrides,
    setElementStyleOverrides,
    copiedStyle,
    setStyleOverride,
    resetStyleOverride,
    updateSelectedStyle,
    getSelectedStyleValue,
    selectedStyleOverride,
    hasSelectedStyleOverride,
    resetSelectedStyle,
    copySelectedStyle,
    pasteSelectedStyle,
  };
};
