import { useEffect } from 'react';
import type { RefObject } from 'react';
import {
  SIGNATURES_CONTENT_ID,
  SIGNATURES_STYLE_ID,
  readSignaturesOverride,
} from './types';
import type { ElementStyleOverride } from './types';

interface UseDesignerSignaturesCanvasSyncParams {
  previewScopeRef: RefObject<HTMLDivElement | null>;
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  reportPayload: unknown;
  renderedPagesCount: number;
}

export function useDesignerSignaturesCanvasSync({
  previewScopeRef,
  elementTextOverrides,
  elementStyleOverrides,
  reportPayload,
  renderedPagesCount,
}: UseDesignerSignaturesCanvasSyncParams): void {
  useEffect(() => {
    const root = previewScopeRef.current;
    if (!root) return;

    const sigFragment = Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).find(
      (el) => el.dataset.fragId === 'frag-signatures'
    );
    if (!sigFragment) return;

    // Content override: replace signature name/role/rank text in DOM
    const sigOverride = readSignaturesOverride(elementTextOverrides[SIGNATURES_CONTENT_ID]);
    if (sigOverride) {
      // Structure: each signer is a column of <p> elements with rank, name (strong), role (strong), date
      // We update the text content of specific cells based on override data
      let signerIdx = 0;
      sigFragment.querySelectorAll<HTMLElement>('[data-signer-idx]').forEach((el) => {
        const idx = Number(el.dataset.signerIdx);
        if (idx < sigOverride.length) {
          const draft = sigOverride[idx];
          const rankEl = el.querySelector<HTMLElement>('[data-field="rank"]');
          const nameEl = el.querySelector<HTMLElement>('[data-field="name"]');
          const roleEl = el.querySelector<HTMLElement>('[data-field="role"]');
          if (rankEl) rankEl.textContent = draft.rank;
          if (nameEl) nameEl.textContent = draft.name;
          if (roleEl) roleEl.textContent = draft.role;
        }
        signerIdx++;
      });

      // Fallback: update all <p><strong> elements matching signers if no data-signer-idx
      // For SignaturesBlock rendered without data attributes, we find by pattern
      if (sigFragment.querySelectorAll('[data-signer-idx]').length === 0) {
        const sigColumns = sigFragment.querySelectorAll<HTMLElement>(':scope > div');
        sigOverride.forEach((draft, idx) => {
          if (idx >= sigColumns.length) return;
          const col = sigColumns[idx];
          const ps = col.querySelectorAll<HTMLElement>('p');
          // Pattern: p[0]=spacer or rank, p[1]=rank or name, p[2]=name or role, p[3]=role or date, p[4]=date
          // More robust: iterate p elements and match strong tags
          let pIdx = 0;
          ps.forEach((p) => {
            const strongEl = p.querySelector<HTMLElement>('strong');
            const text = p.textContent?.trim() || '';
            if (pIdx === 0 && !strongEl) { pIdx++; return; }
            if (strongEl) {
              if (draft.rank && text === sigColumns[idx].querySelectorAll('p strong')[0]?.textContent) {
                strongEl.textContent = draft.rank;
              }
            }
            pIdx++;
          });
        });
      }
    }

    // Style override
    const stOverride = elementStyleOverrides[SIGNATURES_STYLE_ID];
    if (!stOverride) return;

    const nameEls = sigFragment.querySelectorAll<HTMLElement>('strong');
    const allPEls = sigFragment.querySelectorAll<HTMLElement>('p');

    // Name styling (strong elements)
    nameEls.forEach((strong) => {
      if ((stOverride as any).nameFontSize !== undefined) strong.style.setProperty('font-size', `${(stOverride as any).nameFontSize}px`, 'important');
      if ((stOverride as any).nameColor) strong.style.setProperty('color', (stOverride as any).nameColor, 'important');
      if ((stOverride as any).nameFontWeight) strong.style.setProperty('font-weight', (stOverride as any).nameFontWeight, 'important');
    });

    // Role styling (non-strong p text — apply to all p elements for simplicity)
    allPEls.forEach((p) => {
      if ((stOverride as any).roleFontSize !== undefined) p.style.setProperty('font-size', `${(stOverride as any).roleFontSize}px`, 'important');
      if ((stOverride as any).roleColor) p.style.setProperty('color', (stOverride as any).roleColor, 'important');
      if ((stOverride as any).roleFontWeight) p.style.setProperty('font-weight', (stOverride as any).roleFontWeight, 'important');
    });

    // Layout: spacing and gap
    if (stOverride.paragraphSpacingBefore !== undefined) sigFragment.style.setProperty('margin-top', `${stOverride.paragraphSpacingBefore}px`, 'important');
    if (stOverride.paragraphSpacingAfter !== undefined) sigFragment.style.setProperty('margin-bottom', `${stOverride.paragraphSpacingAfter}px`, 'important');
    if ((stOverride as any).signatureGap !== undefined) {
      const cols = sigFragment.querySelectorAll<HTMLElement>(':scope > div');
      cols.forEach((col) => {
        (col as HTMLElement).style.setProperty('margin-bottom', `${(stOverride as any).signatureGap}px`, 'important');
      });
    }
  }, [elementTextOverrides, elementStyleOverrides, reportPayload, renderedPagesCount]);
}
