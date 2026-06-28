import type { SelectedElementType } from './types';

type UseDesignerSelectionDerivedParams = {
  selectedElementType: SelectedElementType;
  selectedElementId: string | null;
  elementTextOverrides: Record<string, string>;
};

export const useDesignerSelectionDerived = ({
  selectedElementType,
  selectedElementId,
  elementTextOverrides,
}: UseDesignerSelectionDerivedParams) => {
  const canEditSelectedText =
    selectedElementType === 'mainTitle' ||
    selectedElementType === 'numbering' ||
    selectedElementType === 'paragraph' ||
    selectedElementType === 'subheading' ||
    selectedElementType === 'tableCell';
  const hasSelectedTextOverride = selectedElementId ? elementTextOverrides[selectedElementId] !== undefined : false;

  return {
    canEditSelectedText,
    hasSelectedTextOverride,
  };
};
