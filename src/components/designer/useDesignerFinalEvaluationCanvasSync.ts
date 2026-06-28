import { useEffect } from 'react';
import type { RefObject } from 'react';
import { FINAL_EVALUATION_CONTENT_ID, FINAL_EVALUATION_STYLE_ID } from './types';
import type { ElementStyleOverride } from './types';

interface UseDesignerFinalEvaluationCanvasSyncParams {
  previewScopeRef: RefObject<HTMLDivElement | null>;
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  reportPayload: unknown;
  renderedPagesCount: number;
}

export function useDesignerFinalEvaluationCanvasSync({
  previewScopeRef,
  elementTextOverrides,
  elementStyleOverrides,
  reportPayload,
  renderedPagesCount,
}: UseDesignerFinalEvaluationCanvasSyncParams): void {
  useEffect(() => {
    const root = previewScopeRef.current;
    if (!root) return;

    // Content override: replace final evaluation statement text
    if (elementTextOverrides[FINAL_EVALUATION_CONTENT_ID] !== undefined) {
      const newText = elementTextOverrides[FINAL_EVALUATION_CONTENT_ID];
      const evalFragments = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).filter(
        (el) => el.dataset.fragId === 'frag-final-evaluation'
      );
      evalFragments.forEach((frag) => {
        const heading = frag.querySelector<HTMLElement>('h3.section-num') || frag.querySelector<HTMLElement>('h3');
        if (heading) {
          const numSpan = heading.querySelector<HTMLElement>('.rd-numbering');
          const prefix = numSpan ? numSpan.outerHTML + ' ' : '';
          heading.innerHTML = prefix + newText;
        }
      });
    }

    // Style override
    const stOverride = elementStyleOverrides[FINAL_EVALUATION_STYLE_ID];
    if (!stOverride) return;

    const evalFragments = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).filter(
      (el) => el.dataset.fragId === 'frag-final-evaluation'
    );

    evalFragments.forEach((frag) => {
      const headings = frag.querySelectorAll<HTMLElement>('h3, .section-num');
      headings.forEach((h) => {
        if (stOverride.paragraphFontSize !== undefined) h.style.setProperty('font-size', `${stOverride.paragraphFontSize}px`, 'important');
        if (stOverride.paragraphColor) h.style.setProperty('color', stOverride.paragraphColor, 'important');
        if (stOverride.paragraphFontWeight) h.style.setProperty('font-weight', stOverride.paragraphFontWeight, 'important');
        if (stOverride.paragraphLineHeight !== undefined) h.style.setProperty('line-height', String(stOverride.paragraphLineHeight), 'important');
        if (stOverride.titleTextAlign) h.style.setProperty('text-align', stOverride.titleTextAlign, 'important');
      });

      // Layout: spacing
      if (stOverride.paragraphSpacingBefore !== undefined) frag.style.setProperty('margin-top', `${stOverride.paragraphSpacingBefore}px`, 'important');
      if (stOverride.paragraphSpacingAfter !== undefined) frag.style.setProperty('margin-bottom', `${stOverride.paragraphSpacingAfter}px`, 'important');
    });
  }, [elementTextOverrides, elementStyleOverrides, reportPayload, renderedPagesCount]);
}
