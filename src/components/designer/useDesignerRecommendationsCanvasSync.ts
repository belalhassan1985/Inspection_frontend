import { useEffect } from 'react';
import type { RefObject } from 'react';
import {
  RECOMMENDATIONS_CONTENT_ID,
  RECOMMENDATIONS_STYLE_ID,
  readRecommendationsOverride,
} from './types';
import type { ElementStyleOverride } from './types';

interface UseDesignerRecommendationsCanvasSyncParams {
  previewScopeRef: RefObject<HTMLDivElement | null>;
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  reportPayload: unknown;
  renderedPagesCount: number;
}

export function useDesignerRecommendationsCanvasSync({
  previewScopeRef,
  elementTextOverrides,
  elementStyleOverrides,
  reportPayload,
  renderedPagesCount,
}: UseDesignerRecommendationsCanvasSyncParams): void {
  useEffect(() => {
    const root = previewScopeRef.current;
    if (!root) return;

    // Content override: replace recommendation item text in DOM
    const recOverride = readRecommendationsOverride(elementTextOverrides[RECOMMENDATIONS_CONTENT_ID]);
    if (recOverride) {
      recOverride.forEach((group) => {
        if (group.recs) {
          group.recs.forEach((rec: any) => {
            if (!rec.id) return;
            const fragId = `recommendation/${rec.id}`;
            const fragEl = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).find((el) => el.dataset.fragId === fragId);
            if (!fragEl) return;
            const textSpan = fragEl.querySelector<HTMLElement>('.rd-paragraph-text span:last-child') || fragEl.querySelector<HTMLElement>('.rd-paragraph-text');
            if (textSpan && rec.text) {
              textSpan.textContent = rec.text;
            }
          });
        }
        // Update authority title text
        const titleFragId = `recommendation-group/${group.id}`;
        const titleFragEl = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).find((el) => el.dataset.fragId === titleFragId);
        if (titleFragEl && group.authority) {
          const authoritySpan = titleFragEl.querySelector<HTMLElement>('.rd-subheading-title span:last-child') || titleFragEl.querySelector<HTMLElement>('.rd-subheading-title');
          if (authoritySpan) {
            const numSpan = titleFragEl.querySelector<HTMLElement>('.rd-numbering');
            if (numSpan) {
              // Keep numbering prefix, replace the rest
              authoritySpan.textContent = ' ' + group.authority;
            } else {
              authoritySpan.textContent = group.authority;
            }
          }
        }
      });
    }

    // Style override
    const stOverride = elementStyleOverrides[RECOMMENDATIONS_STYLE_ID];
    if (!stOverride) return;

    const recFragments = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).filter(
      (el) => el.dataset.fragId?.startsWith('recommendation')
    );

    recFragments.forEach((frag) => {
      // Style: numbering spans
      const numberSpans = frag.querySelectorAll<HTMLElement>('.rd-numbering');
      numberSpans.forEach((span) => {
        if (stOverride.numberingFontSize !== undefined) span.style.setProperty('font-size', `${stOverride.numberingFontSize}px`, 'important');
        if (stOverride.numberingColor) span.style.setProperty('color', stOverride.numberingColor, 'important');
      });

      // Style: paragraph text + subheading elements
      const textEls = frag.querySelectorAll<HTMLElement>('.rd-paragraph-text, .rd-subheading-title');
      textEls.forEach((el) => {
        if (stOverride.paragraphFontSize !== undefined) el.style.setProperty('font-size', `${stOverride.paragraphFontSize}px`, 'important');
        if (stOverride.paragraphColor) el.style.setProperty('color', stOverride.paragraphColor, 'important');
        if (stOverride.paragraphFontWeight) el.style.setProperty('font-weight', stOverride.paragraphFontWeight, 'important');
        if (stOverride.paragraphLineHeight !== undefined) el.style.setProperty('line-height', String(stOverride.paragraphLineHeight), 'important');
      });

      // Layout: item spacing — applies margin-bottom to each recommendation item fragment
      const fragId = frag.dataset.fragId || '';
      if (fragId.includes('-item-') && stOverride.itemSpacing !== undefined) {
        frag.style.setProperty('margin-bottom', `${stOverride.itemSpacing}px`, 'important');
      }
    });

    // Layout: spacing before (on title fragment)
    if (stOverride.paragraphSpacingBefore !== undefined) {
      const titleFrag = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).find((el) => el.dataset.fragId === 'frag-recommendations-title');
      if (titleFrag) titleFrag.style.setProperty('margin-top', `${stOverride.paragraphSpacingBefore}px`, 'important');
    }

    // Layout: spacing after (on last fragment)
    if (stOverride.paragraphSpacingAfter !== undefined && recFragments.length > 0) {
      const lastFrag = recFragments[recFragments.length - 1];
      lastFrag.style.setProperty('margin-bottom', `${stOverride.paragraphSpacingAfter}px`, 'important');
    }
  }, [elementTextOverrides, elementStyleOverrides, reportPayload, renderedPagesCount]);
}
