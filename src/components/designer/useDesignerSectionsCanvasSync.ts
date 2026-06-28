import { useEffect } from 'react';
import type { RefObject } from 'react';

interface UseDesignerSectionsCanvasSyncParams {
  previewScopeRef: RefObject<HTMLDivElement | null>;
  elementTextOverrides: Record<string, string>;
  reportPayload: unknown;
  renderedPagesCount: number;
}

// ── Legacy positional ID patterns (backward compat) ──
const SEC_TITLE_RE             = /^sec-(\d+)-title:/;
const SEC_NARRATIVE_RE         = /^sec-(\d+):narrative$/;
const SUB_TITLE_RE             = /^sec-(\d+)-sub-(\d+)-title:/;
const FINDING_RE               = /^sec-(\d+)-sub-(\d+)-finding-(\d+):/;
const SUB_NARRATIVE_RE         = /^sec-(\d+)-sub-(\d+)-narrative:narrative$/;
const SEC_LIST_ITEM_RE         = /^sec-(\d+)-list-(positives|negatives|impediments|obstacles)-item-(\d+):finding$/;
const SUB_LIST_ITEM_RE         = /^sec-(\d+)-sub-(\d+)-list-(positives|negatives|impediments|obstacles)-item-(\d+):finding$/;

function legacyDomId(key: string, pattern: RegExp, template: (groups: string[]) => string): string | null {
  const m = key.match(pattern);
  if (!m) return null;
  return template(m.slice(1));
}

function fragIdFromKey(key: string): string {
  const colonIdx = key.indexOf(':');
  return colonIdx === -1 ? key : key.slice(0, colonIdx);
}

function findFragEl(root: HTMLElement, fragId: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-frag-id="${fragId}"]`);
}

function updateSubheading(root: HTMLElement, fragId: string, value: string): void {
  const fragEl = findFragEl(root, fragId);
  if (!fragEl) return;
  const subheading = fragEl.querySelector<HTMLElement>('.rd-subheading-title');
  if (!subheading) return;
  const numSpan = subheading.querySelector<HTMLElement>('.rd-numbering');
  const prefix = numSpan ? numSpan.outerHTML + ' ' : '';
  subheading.innerHTML = prefix + value;
}

function updateParagraphText(root: HTMLElement, fragId: string, value: string): void {
  const fragEl = findFragEl(root, fragId);
  if (!fragEl) return;
  const textEl = fragEl.querySelector<HTMLElement>('.rd-paragraph-text');
  if (!textEl) return;
  const numSpan = textEl.querySelector<HTMLElement>('.rd-numbering');
  const prefix = numSpan ? numSpan.outerHTML + ' ' : '';
  textEl.innerHTML = prefix + value;
}

function updateSimpleText(root: HTMLElement, fragId: string, value: string): void {
  const fragEl = findFragEl(root, fragId);
  if (!fragEl) return;
  const textEl = fragEl.querySelector<HTMLElement>('.rd-paragraph-text') || fragEl.firstElementChild as HTMLElement | null;
  if (textEl) textEl.textContent = value;
}

export function useDesignerSectionsCanvasSync({
  previewScopeRef,
  elementTextOverrides,
  reportPayload,
  renderedPagesCount,
}: UseDesignerSectionsCanvasSyncParams): void {
  useEffect(() => {
    const root = previewScopeRef.current;
    if (!root) return;

    for (const [key, value] of Object.entries(elementTextOverrides)) {
      // ── Try legacy positional patterns first (backward compatibility) ──
      const legacyTitle = legacyDomId(key, SEC_TITLE_RE, (g) => `sec-${g[0]}-title`);
      if (legacyTitle) { updateSubheading(root, legacyTitle, value); continue; }

      const legacyNarrative = legacyDomId(key, SEC_NARRATIVE_RE, (g) => `sec-${g[0]}-narrative`);
      if (legacyNarrative) { updateSimpleText(root, legacyNarrative, value); continue; }

      const legacySubTitle = legacyDomId(key, SUB_TITLE_RE, (g) => `sec-${g[0]}-sub-${g[1]}-title`);
      if (legacySubTitle) { updateSubheading(root, legacySubTitle, value); continue; }

      const legacyFinding = legacyDomId(key, FINDING_RE, (g) => `sec-${g[0]}-sub-${g[1]}-finding-${g[2]}`);
      if (legacyFinding) { updateSimpleText(root, legacyFinding, value); continue; }

      const legacySubNarrative = legacyDomId(key, SUB_NARRATIVE_RE, (g) => `sec-${g[0]}-sub-${g[1]}-narrative`);
      if (legacySubNarrative) { updateSimpleText(root, legacySubNarrative, value); continue; }

      const legacySecList = legacyDomId(key, SEC_LIST_ITEM_RE, (g) => `sec-${g[0]}-list-${g[1]}-item-${g[2]}`);
      if (legacySecList) { updateParagraphText(root, legacySecList, value); continue; }

      const legacySubList = legacyDomId(key, SUB_LIST_ITEM_RE, (g) => `sec-${g[0]}-sub-${g[1]}-list-${g[2]}-item-${g[3]}`);
      if (legacySubList) { updateParagraphText(root, legacySubList, value); continue; }

      // ── Phase 46B: stable fragment ID — use fragmentId directly in DOM query ──
      const fragId = fragIdFromKey(key);
      if (!fragId) continue;

      const suffix = key.slice(fragId.length + 1); // type after the first ':'
      if (suffix.startsWith('subheading') || suffix.startsWith('section-title') || suffix.startsWith('subsection-title')) {
        updateSubheading(root, fragId, value);
      } else if (suffix.startsWith('paragraph') || suffix.startsWith('narrative') || suffix.startsWith('finding')) {
        updateSimpleText(root, fragId, value);
      } else {
        // Fallback: try direct fragment lookup
        const fragEl = findFragEl(root, fragId);
        if (fragEl) {
          const textEl = fragEl.querySelector<HTMLElement>('.rd-paragraph-text') || fragEl.firstElementChild as HTMLElement | null;
          if (textEl) textEl.textContent = value;
        }
      }
    }
  }, [elementTextOverrides, reportPayload, renderedPagesCount]);
}
