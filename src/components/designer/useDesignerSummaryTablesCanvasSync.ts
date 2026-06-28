import { useEffect } from 'react';
import type { RefObject } from 'react';
import {
  SUMMARY_TABLES_CONTENT_ID,
  SUMMARY_TABLES_STYLE_ID,
  TABLE_CELL_PADDING_PX,
} from './types';
import type { ElementStyleOverride, TableCellPaddingChoice } from './types';

interface UseDesignerSummaryTablesCanvasSyncParams {
  previewScopeRef: RefObject<HTMLDivElement | null>;
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  reportPayload: unknown;
  renderedPagesCount: number;
}

export function useDesignerSummaryTablesCanvasSync({
  previewScopeRef,
  elementTextOverrides,
  elementStyleOverrides,
  reportPayload,
  renderedPagesCount,
}: UseDesignerSummaryTablesCanvasSyncParams): void {
  useEffect(() => {
    const root = previewScopeRef.current;
    if (!root) return;
    const summaryFragments = Array.from(root.querySelectorAll<HTMLElement>(
      '[data-frag-id^="frag-summary-tables"]'
    ));
    if (summaryFragments.length === 0) return;

    // Content override: section title text
    const titleOverrideRaw = elementTextOverrides[SUMMARY_TABLES_CONTENT_ID];
    if (titleOverrideRaw) {
      try {
        const parsed = JSON.parse(titleOverrideRaw);
        const newTitle = String(parsed?.sectionTitle ?? '');
        if (newTitle) {
          summaryFragments.forEach((frag) => {
            const sectionNumEl = frag.querySelector<HTMLElement>('.section-num');
            if (sectionNumEl) {
              // Preserve the numbering prefix (e.g. "5-") and replace the rest
              const currentText = sectionNumEl.textContent || '';
              const numMatch = currentText.match(/^[٠-٩0-9\-–\.]+\s*/);
              const prefix = numMatch ? numMatch[0] : '';
              sectionNumEl.textContent = prefix + newTitle;
            }
          });
        }
      } catch { /* ignore */ }
    }

    // Style overrides
    const stOverride = elementStyleOverrides[SUMMARY_TABLES_STYLE_ID];
    if (!stOverride) return;

    summaryFragments.forEach((frag) => {
      // Header styling
      frag.querySelectorAll<HTMLElement>('thead th').forEach((th) => {
        if (stOverride.tableHeaderBackgroundColor) th.style.setProperty('background-color', stOverride.tableHeaderBackgroundColor, 'important');
        if (stOverride.tableHeaderTextColor) th.style.setProperty('color', stOverride.tableHeaderTextColor, 'important');
        if (stOverride.tableFontWeight) th.style.setProperty('font-weight', stOverride.tableFontWeight, 'important');
        if (stOverride.tableFontSize !== undefined) th.style.setProperty('font-size', `${stOverride.tableFontSize}px`, 'important');
        if (stOverride.tableBorderColor) th.style.setProperty('border-color', stOverride.tableBorderColor, 'important');
        if (stOverride.tableBorderWidth !== undefined) th.style.setProperty('border-width', `${stOverride.tableBorderWidth}px`, 'important');
        if (stOverride.tableCellPadding) th.style.setProperty('padding', TABLE_CELL_PADDING_PX[stOverride.tableCellPadding as TableCellPaddingChoice] || stOverride.tableCellPadding as string, 'important');
      });

      // Body cell styling
      frag.querySelectorAll<HTMLElement>('tbody td').forEach((td) => {
        if (stOverride.tableFontSize !== undefined) td.style.setProperty('font-size', `${stOverride.tableFontSize}px`, 'important');
        if (stOverride.tableFontWeight) td.style.setProperty('font-weight', stOverride.tableFontWeight, 'important');
        if (stOverride.tableBorderColor) td.style.setProperty('border-color', stOverride.tableBorderColor, 'important');
        if (stOverride.tableBorderWidth !== undefined) td.style.setProperty('border-width', `${stOverride.tableBorderWidth}px`, 'important');
        if (stOverride.tableCellPadding) td.style.setProperty('padding', TABLE_CELL_PADDING_PX[stOverride.tableCellPadding as TableCellPaddingChoice] || stOverride.tableCellPadding as string, 'important');
      });

      // Table border styling
      frag.querySelectorAll<HTMLElement>('table').forEach((table) => {
        if (stOverride.tableBorderColor) table.style.setProperty('border-color', stOverride.tableBorderColor, 'important');
        if (stOverride.tableBorderWidth !== undefined) table.style.setProperty('border-width', `${stOverride.tableBorderWidth}px`, 'important');
      });

      // Layout: spacing before/after
      if (stOverride.paragraphSpacingBefore !== undefined) frag.style.setProperty('margin-top', `${stOverride.paragraphSpacingBefore}px`, 'important');
      if (stOverride.paragraphSpacingAfter !== undefined) frag.style.setProperty('margin-bottom', `${stOverride.paragraphSpacingAfter}px`, 'important');
    });
  }, [elementTextOverrides, elementStyleOverrides, reportPayload, renderedPagesCount]);
}
