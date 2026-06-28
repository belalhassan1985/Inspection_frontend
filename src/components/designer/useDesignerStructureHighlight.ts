import { useEffect } from 'react';
import type { RefObject } from 'react';

interface UseDesignerStructureHighlightParams {
  previewScopeRef: RefObject<HTMLDivElement | null>;
  highlightedStructureAnchorId: string | null;
  renderedPagesCount: number;
  designerMode: string;
}

export function useDesignerStructureHighlight({
  previewScopeRef,
  highlightedStructureAnchorId,
  renderedPagesCount,
  designerMode,
}: UseDesignerStructureHighlightParams): void {
  useEffect(() => {
    const root = previewScopeRef.current;
    if (!root) return;

    root.querySelectorAll<HTMLElement>('.rd-structure-highlight').forEach((element) => {
      element.classList.remove('rd-structure-highlight');
    });

    if (!highlightedStructureAnchorId) return;

    const target = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment'))
      .find((element) => element.dataset.fragId === highlightedStructureAnchorId);

    if (target) target.classList.add('rd-structure-highlight');

    return () => {
      target?.classList.remove('rd-structure-highlight');
    };
  }, [highlightedStructureAnchorId, renderedPagesCount, designerMode]);
}
