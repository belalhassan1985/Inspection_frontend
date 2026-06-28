import { useEffect } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { getElementId, getElementText } from './designerSelection';
import { applyCss, clearDesignerInlineStyle } from './designerCanvasDomSync';
import { detectNumberingLevel, tableStyleToCss, textStyleToCss } from './designerStyleOverrides';
import { TABLE_CELL_PADDING_PX } from './types';
import type { SelectedElementType, DesignerStyleState, ElementStyleOverride } from './types';

interface UseDesignerMainStyleSyncParams {
  previewScopeRef: RefObject<HTMLDivElement | null>;
  originalTextRef: RefObject<Record<string, string>>;
  selectedElementRef: RefObject<HTMLElement | null>;
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  styleState: DesignerStyleState;
  designerMode: string;
  selectedElementId: string | null;
  reportPayload: unknown;
  renderedPagesCount: number;
}

export function useDesignerMainStyleSync({
  previewScopeRef,
  originalTextRef,
  selectedElementRef,
  elementTextOverrides,
  elementStyleOverrides,
  styleState,
  designerMode,
  selectedElementId,
  reportPayload,
  renderedPagesCount,
}: UseDesignerMainStyleSyncParams): void {
  useEffect(() => {
    const root = previewScopeRef.current;
    if (!root) return;

    const candidates: Array<[Exclude<SelectedElementType, null>, string]> = [
      ['page', '.rd-a4-page'],
      ['mainTitle', '.rd-fragment-reportTitle h1'],
      ['numbering', '.rd-numbering, .section-num'],
      ['subheading', '.rd-subheading-title'],
      ['paragraph', '.rd-paragraph-text, .section-body, .rd-fragment-narrative, .rd-fragment-inspectionDetailItem'],
      ['table', 'table, .military-table'],
      ['tableCell', 'td, th'],
    ];

    candidates.forEach(([type, selector]) => {
      root.querySelectorAll(selector).forEach((node) => {
        const element = node as HTMLElement;
        const elementId = getElementId(type, element);
        const override = elementStyleOverrides[elementId];
        const shouldPreservePagePadding = type === 'page' && !override;

        clearDesignerInlineStyle(element, { preservePadding: shouldPreservePagePadding });
        if (type === 'table') {
          element.querySelectorAll('th, td').forEach((cell) => clearDesignerInlineStyle(cell as HTMLElement));
        }

        // Phase 51H: only mutate textContent when an explicit override exists.
        // Do NOT restore from originalTextRef when no override is active — that
        // causes stale-text measurement traps where BlockMeasurer and visible
        // preview disagree on heights because originalTextRef holds text from a
        // previous render/campaign/page assignment.
        const hasTextOverride = elementTextOverrides[elementId] !== undefined;
        if (hasTextOverride && type !== 'page' && type !== 'table') {
          if (originalTextRef.current[elementId] === undefined) {
            originalTextRef.current[elementId] = getElementText(element);
          }
          element.textContent = elementTextOverrides[elementId];
          if (designerMode === 'edit') element.classList.add('rd-edited-text');
        }

        // Phase 19A / 51C: numbering uses global level style + per-element override.
        // For .rd-numbering elements, global level styles are handled by CSS (Phase 51A
        // render-time data-numbering-level attribute + buildPreviewStyleCss !important rules).
        // Only .section-num elements (from reportView components) need inline global styles.
        if (type === 'numbering') {
          const level = detectNumberingLevel(element);
          if (level) {
            element.dataset.numberingLevel = String(level);
          } else {
            delete element.dataset.numberingLevel;
          }
          const isRdNumbering = element.classList.contains('rd-numbering');
          const perElementStyle = override ? textStyleToCss('numbering', override) : {};
          if (isRdNumbering) {
            // .rd-numbering: global styles come from CSS; only apply per-element overrides.
            if (Object.keys(perElementStyle).length > 0) {
              applyCss(element, perElementStyle);
            }
          } else {
            // .section-num: apply both global level styles and per-element overrides inline.
            const globalStyle: CSSProperties = {};
            if (level) {
              const gColor = styleState[`numberingLevel${level}Color` as keyof DesignerStyleState] as string;
              const gSize = styleState[`numberingLevel${level}FontSize` as keyof DesignerStyleState] as number;
              const gWeight = styleState[`numberingLevel${level}Weight` as keyof DesignerStyleState] as string;
              if (gColor) globalStyle.color = gColor;
              if (gSize && gSize > 0) globalStyle.fontSize = `${gSize}px`;
              if (gWeight && gWeight !== 'normal') globalStyle.fontWeight = gWeight;
            }
            applyCss(element, { ...globalStyle, ...perElementStyle });
          }
          return;
        }

        if (!override) return;

        if (type === 'page') {
          if (override.showPageBorder !== undefined) {
            element.style.border = override.showPageBorder ? '2px solid #475569' : '1px solid transparent';
          }
          const bounds = element.querySelector('.rd-content-bounds') as HTMLElement | null;
          const safe = element.querySelector('.rd-safe-area') as HTMLElement | null;
          if (bounds && override.showContentBounds !== undefined) bounds.style.display = override.showContentBounds ? 'block' : 'none';
          if (safe && override.showSafeArea !== undefined) safe.style.display = override.showSafeArea ? 'block' : 'none';
          return;
        }

        if (type === 'table') {
          applyCss(element, tableStyleToCss(override));
          element.querySelectorAll('th, td').forEach((cell) => {
            const cellElement = cell as HTMLElement;
            applyCss(cellElement, tableStyleToCss(override));
            if (override.tableCellPadding) cellElement.style.padding = TABLE_CELL_PADDING_PX[override.tableCellPadding];
          });
          element.querySelectorAll('thead tr, thead th').forEach((header) => {
            const headerElement = header as HTMLElement;
            if (override.tableHeaderBackgroundColor) headerElement.style.backgroundColor = override.tableHeaderBackgroundColor;
            if (override.tableHeaderTextColor) headerElement.style.color = override.tableHeaderTextColor;
          });
          return;
        }

        if (type === 'tableCell') {
          applyCss(element, tableStyleToCss(override));
          if (override.tableCellPadding) element.style.padding = TABLE_CELL_PADDING_PX[override.tableCellPadding];
          return;
        }

        applyCss(element, textStyleToCss(type, override));
      });
    });

    if (designerMode === 'edit' && selectedElementId) {
      const selected = Array.from(root.querySelectorAll<HTMLElement>('.rd-a4-page, .rd-fragment-reportTitle h1, .rd-numbering, .section-num, .rd-subheading-title, .rd-paragraph-text, .section-body, table, .military-table, td, th'))
        .find((element) => {
          const type = element.matches('.rd-a4-page')
            ? 'page'
            : element.matches('td, th')
              ? 'tableCell'
              : element.matches('table, .military-table')
                ? 'table'
                : element.matches('.rd-fragment-reportTitle h1')
                  ? 'mainTitle'
                  : element.matches('.rd-numbering, .section-num')
                    ? 'numbering'
                    : element.matches('.rd-subheading-title')
                      ? 'subheading'
                      : 'paragraph';
          return getElementId(type, element) === selectedElementId;
        });
      if (selected) {
        selected.classList.add('rd-selected-element');
        selectedElementRef.current = selected;
      }
    }
  }, [designerMode, elementStyleOverrides, elementTextOverrides, reportPayload, selectedElementId, styleState, renderedPagesCount]);
}
