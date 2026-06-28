import { useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';

type UseDesignerTextOverridesParams = {
  selectedElementId: string | null;
  setSelectedElementText: Dispatch<SetStateAction<string>>;
  originalTextRef: MutableRefObject<Record<string, string>>;
};

export const useDesignerTextOverrides = ({
  selectedElementId,
  setSelectedElementText,
  originalTextRef,
}: UseDesignerTextOverridesParams) => {
  const [elementTextOverrides, setElementTextOverrides] = useState<Record<string, string>>({});

  const setTextOverride = (key: string, value: string) =>
    setElementTextOverrides((prev) => ({ ...prev, [key]: value }));

  const resetTextOverride = (key: string) =>
    setElementTextOverrides((prev) => { const next = { ...prev }; delete next[key]; return next; });

  const updateSelectedText = (value: string) => {
    if (!selectedElementId) return;
    setSelectedElementText(value);
    setTextOverride(selectedElementId, value);
  };

  const resetSelectedText = () => {
    if (!selectedElementId) return;
    resetTextOverride(selectedElementId);
    setSelectedElementText(originalTextRef.current[selectedElementId] || '');
  };

  const resetAllTextEdits = () => {
    setElementTextOverrides({});
    if (selectedElementId) setSelectedElementText(originalTextRef.current[selectedElementId] || '');
  };

  return {
    elementTextOverrides,
    setElementTextOverrides,
    setTextOverride,
    resetTextOverride,
    updateSelectedText,
    resetSelectedText,
    resetAllTextEdits,
  };
};
