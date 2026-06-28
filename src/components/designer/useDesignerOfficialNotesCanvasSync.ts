import { useEffect } from 'react';
import type { RefObject } from 'react';
import { simpleContentHash } from '../../utils/reportFragments';
import {
  OFFICIAL_NOTES_CONTENT_ID,
  OFFICIAL_NOTES_STYLE_ID,
  OFFICIAL_NOTES_LIST_TYPES,
  readOfficialNotesOverride,
} from './types';
import type { ElementStyleOverride } from './types';

interface UseDesignerOfficialNotesCanvasSyncParams {
  previewScopeRef: RefObject<HTMLDivElement | null>;
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  reportPayload: unknown;
  renderedPagesCount: number;
}

export function useDesignerOfficialNotesCanvasSync({
  previewScopeRef,
  elementTextOverrides,
  elementStyleOverrides,
  reportPayload,
  renderedPagesCount,
}: UseDesignerOfficialNotesCanvasSyncParams): void {
  useEffect(() => {
    const root = previewScopeRef.current;
    if (!root) return;

    // Content override: replace note item text in DOM
    const contentOverride = readOfficialNotesOverride(elementTextOverrides[OFFICIAL_NOTES_CONTENT_ID]);
    if (contentOverride) {
      OFFICIAL_NOTES_LIST_TYPES.forEach((type) => {
        const overrideList = contentOverride[type];
        if (!overrideList) return;
        overrideList.forEach((text, idx) => {
          // Phase 46B: compute stable fragment ID from content hash
          const computedHash = text ? simpleContentHash(text) : `${type}-${idx}`;
          const fragId = `list-item/official_notes/${type}/${computedHash}`;
          const fragEl = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).find((el) => el.dataset.fragId === fragId);
          if (!fragEl) return;
          // Find the paragraph text element (the .rd-paragraph-text div)
          const textEl = fragEl.querySelector<HTMLElement>('.rd-paragraph-text');
          if (textEl) {
            // Preserve numbering span if it exists
            const numSpan = textEl.querySelector<HTMLElement>('.rd-numbering');
            const prefix = numSpan ? numSpan.outerHTML + ' ' : '';
            textEl.innerHTML = prefix + text;
          }
        });
      });
    }

    // Style override
    const stOverride = elementStyleOverrides[OFFICIAL_NOTES_STYLE_ID];
    if (!stOverride) return;

    // Apply to all frag-official-notes-* fragments
    const noteFragments = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).filter(
      (el) => el.dataset.fragId?.startsWith('frag-official-notes')
    );

    noteFragments.forEach((frag) => {
      // Style: text elements (.rd-paragraph-text, .rd-subheading-title)
      const textEls = frag.querySelectorAll<HTMLElement>('.rd-paragraph-text, .rd-subheading-title');
      textEls.forEach((el) => {
        if (stOverride.paragraphFontSize !== undefined) el.style.setProperty('font-size', `${stOverride.paragraphFontSize}px`, 'important');
        if (stOverride.paragraphColor) el.style.setProperty('color', stOverride.paragraphColor, 'important');
        if (stOverride.paragraphFontWeight) el.style.setProperty('font-weight', stOverride.paragraphFontWeight, 'important');
        if (stOverride.paragraphLineHeight !== undefined) el.style.setProperty('line-height', String(stOverride.paragraphLineHeight), 'important');
        if (stOverride.titleTextAlign) el.style.setProperty('text-align', stOverride.titleTextAlign, 'important');
      });

      // Also apply to section-num headings
      const headings = frag.querySelectorAll<HTMLElement>('.section-num');
      headings.forEach((h) => {
        if (stOverride.paragraphColor) h.style.setProperty('color', stOverride.paragraphColor, 'important');
        if (stOverride.paragraphFontWeight) h.style.setProperty('font-weight', stOverride.paragraphFontWeight, 'important');
      });

      // Layout: spacing (apply to first/last fragment in the group)
      const fragId = frag.dataset.fragId || '';
      if (fragId === 'frag-official-notes-title' && stOverride.paragraphSpacingBefore !== undefined) {
        frag.style.setProperty('margin-top', `${stOverride.paragraphSpacingBefore}px`, 'important');
      }
    });

    // Apply spacing-after to the last note fragment
    if (stOverride.paragraphSpacingAfter !== undefined && noteFragments.length > 0) {
      const lastFrag = noteFragments[noteFragments.length - 1];
      lastFrag.style.setProperty('margin-bottom', `${stOverride.paragraphSpacingAfter}px`, 'important');
    }
  }, [elementTextOverrides, elementStyleOverrides, reportPayload, renderedPagesCount]);
}
