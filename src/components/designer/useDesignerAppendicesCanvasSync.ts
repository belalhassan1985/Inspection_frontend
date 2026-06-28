import { useEffect } from 'react';
import type { RefObject } from 'react';
import {
  APPENDICES_CONTENT_ID,
  APPENDICES_STYLE_ID,
  readAppendicesOverride,
} from './types';
import type { ElementStyleOverride } from './types';

interface UseDesignerAppendicesCanvasSyncParams {
  previewScopeRef: RefObject<HTMLDivElement | null>;
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  reportPayload: unknown;
  renderedPagesCount: number;
}

export function useDesignerAppendicesCanvasSync({
  previewScopeRef,
  elementTextOverrides,
  elementStyleOverrides,
  reportPayload,
  renderedPagesCount,
}: UseDesignerAppendicesCanvasSyncParams): void {
  useEffect(() => {
    const root = previewScopeRef.current;
    if (!root) return;

    // Content override: replace appendix title/paragraph text in DOM
    const appendicesContentOverride = readAppendicesOverride(elementTextOverrides[APPENDICES_CONTENT_ID]);
    if (appendicesContentOverride) {
      appendicesContentOverride.forEach((appendix) => {
        if (!appendix.id) return;
        const appendixId = appendix.id;

        // Update appendix title (symbol)
        const titleFragEl = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).find(
          (el) => el.dataset.fragId === `appendix/${appendixId}`
        );
        if (titleFragEl && appendix.symbol) {
          const titleSpan = titleFragEl.querySelector<HTMLElement>('.rd-subheading-title span:last-child') || titleFragEl.querySelector<HTMLElement>('.rd-subheading-title');
          if (titleSpan) {
            titleSpan.textContent = `ملحق (${appendix.symbol})`;
          }
        }

        // Update appendix paragraphs
        if (appendix.text) {
          const paragraphs = appendix.text.split('\n').filter(Boolean);
          paragraphs.forEach((paragraphText, pIdx) => {
            const paraFragEl = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).find(
              (el) => el.dataset.fragId === `appendix/${appendixId}/paragraph/${pIdx}`
            );
            if (paraFragEl) {
              const textEl = paraFragEl.querySelector<HTMLElement>('.rd-paragraph-text');
              if (textEl) textEl.textContent = paragraphText;
            }
          });
        }
      });
    }

    // Style override
    const stOverride = elementStyleOverrides[APPENDICES_STYLE_ID];
    if (!stOverride) return;

    const appxFragments = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).filter(
      (el) => el.dataset.fragId?.startsWith('appendix/') || el.dataset.fragId === 'frag-appendices-title'
    );

    appxFragments.forEach((frag) => {
      // Title styling (section-num, rd-subheading-title)
      const titleEls = frag.querySelectorAll<HTMLElement>('.section-num, .rd-subheading-title');
      titleEls.forEach((el) => {
        if ((stOverride as any).titleFontSize !== undefined) el.style.setProperty('font-size', `${(stOverride as any).titleFontSize}px`, 'important');
        if ((stOverride as any).titleColor) el.style.setProperty('color', (stOverride as any).titleColor, 'important');
        if ((stOverride as any).titleFontWeight) el.style.setProperty('font-weight', (stOverride as any).titleFontWeight, 'important');
      });

      // Item/paragraph text styling
      const itemEls = frag.querySelectorAll<HTMLElement>('.rd-paragraph-text');
      itemEls.forEach((el) => {
        if (stOverride.paragraphFontSize !== undefined) el.style.setProperty('font-size', `${stOverride.paragraphFontSize}px`, 'important');
        if (stOverride.paragraphColor) el.style.setProperty('color', stOverride.paragraphColor, 'important');
        if (stOverride.paragraphFontWeight) el.style.setProperty('font-weight', stOverride.paragraphFontWeight, 'important');
      });

      // Item spacing
      const fragId = frag.dataset.fragId || '';
      if ((fragId.includes('-paragraph-') || fragId.includes('/paragraph/')) && stOverride.itemSpacing !== undefined) {
        frag.style.setProperty('margin-bottom', `${stOverride.itemSpacing}px`, 'important');
      }
    });

    // Title item styling on appendix title fragments
    const appendixTitleFrags = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).filter(
      (el) => {
        const id = el.dataset.fragId || '';
        return id.startsWith('appendix/') && !id.includes('/paragraph/');
      }
    );
    appendixTitleFrags.forEach((frag) => {
      const subheading = frag.querySelector<HTMLElement>('.rd-subheading-title');
      if (subheading && (stOverride as any).titleFontSize !== undefined) subheading.style.setProperty('font-size', `${(stOverride as any).titleFontSize}px`, 'important');
    });

    // Spacing before/after
    if (stOverride.paragraphSpacingBefore !== undefined) {
      const titleFrag = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).find(
        (el) => el.dataset.fragId === 'frag-appendices-title'
      );
      if (titleFrag) titleFrag.style.setProperty('margin-top', `${stOverride.paragraphSpacingBefore}px`, 'important');
    }
    if (stOverride.paragraphSpacingAfter !== undefined && appxFragments.length > 0) {
      const lastFrag = appxFragments[appxFragments.length - 1];
      lastFrag.style.setProperty('margin-bottom', `${stOverride.paragraphSpacingAfter}px`, 'important');
    }
  }, [elementTextOverrides, elementStyleOverrides, reportPayload, renderedPagesCount]);
}
