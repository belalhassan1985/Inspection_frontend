import type { CSSProperties } from 'react';
import type { DesignerStyleState, ElementStyleOverride, SelectedElementType } from './types';
import {
  CONTENT_BOUNDS_INSET_MM,
  DEFAULT_STYLE_STATE,
  FONT_STACKS,
  TABLE_CELL_PADDING_PX,
  isHexColor,
} from './types';
import { DESIGNER_FOOTER_HEIGHT_MM } from './designerPageLayout';
// Builds the scoped preview CSS (mirrors backend buildStyleOverrideCss intent).
// Scoped to .rd-style-scope so Diagnostics panels are never affected.
export const buildPreviewStyleCss = (s: DesignerStyleState): string => {
  const titleStack = FONT_STACKS[s.mainTitleFontFamily] ?? FONT_STACKS.Cairo;
  const mainTitleColor = isHexColor(s.mainTitleColor) ? s.mainTitleColor : DEFAULT_STYLE_STATE.mainTitleColor;
  const numberingColor = isHexColor(s.numberingColor) ? s.numberingColor : DEFAULT_STYLE_STATE.numberingColor;
  const paragraphColor = isHexColor(s.paragraphColor) ? s.paragraphColor : DEFAULT_STYLE_STATE.paragraphColor;
  const tableBorderColor = isHexColor(s.tableBorderColor) ? s.tableBorderColor : DEFAULT_STYLE_STATE.tableBorderColor;
  const tableHeaderBackgroundColor = isHexColor(s.tableHeaderBackgroundColor)
    ? s.tableHeaderBackgroundColor
    : DEFAULT_STYLE_STATE.tableHeaderBackgroundColor;
  const tableHeaderTextColor = isHexColor(s.tableHeaderTextColor)
    ? s.tableHeaderTextColor
    : DEFAULT_STYLE_STATE.tableHeaderTextColor;
  const boundsInset = CONTENT_BOUNDS_INSET_MM[s.pageMargin] ?? CONTENT_BOUNDS_INSET_MM.normal;
  const tablePadding = TABLE_CELL_PADDING_PX[s.tableCellPadding] ?? TABLE_CELL_PADDING_PX.normal;
  return `
    .rd-style-scope .rd-a4-page {
      border: ${s.showPageBorder ? '2px solid #475569' : '1px solid transparent'} !important;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.2) !important;
      cursor: pointer;
      height: 297mm !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }
    .rd-style-scope .rd-fragment-reportTitle h1,
    .rd-style-scope .rd-numbering,
    .rd-style-scope .rd-paragraph-text,
    .rd-style-scope .section-body,
    .rd-style-scope .rd-fragment-narrative,
    .rd-style-scope .rd-fragment-inspectionDetailItem,
    .rd-style-scope .rd-subheading-title,
    .rd-style-scope table,
    .rd-style-scope .military-table {
      cursor: pointer;
    }
    .rd-style-scope .rd-paragraph-text,
    .rd-style-scope .section-body,
    .rd-style-scope .rd-fragment-narrative,
    .rd-style-scope .rd-fragment-inspectionDetailItem,
    .rd-style-scope .rd-subheading-title {
      white-space: normal !important;
      word-break: normal !important;
      overflow-wrap: normal !important;
    }
    .rd-style-scope td,
    .rd-style-scope th {
      white-space: normal !important;
      word-break: normal !important;
      overflow-wrap: normal !important;
      hyphens: none !important;
    }
    .rd-style-scope .rd-a4-page table,
    .rd-style-scope .rd-a4-page .military-table {
      width: 100% !important;
      max-width: 100% !important;
      table-layout: fixed !important;
      box-sizing: border-box !important;
    }
    .rd-style-scope .rd-a4-page .rd-table-frame {
      max-width: 100% !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }
    .rd-style-scope .rd-a4-content {
      flex: 1 1 auto !important;
      min-height: 0 !important;
      width: 100% !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }
    .rd-style-scope .rd-a4-header {
      position: absolute !important;
      left: 0 !important;
      right: 0 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      overflow: visible !important;
      z-index: 20 !important;
      top: 4mm !important;
    }
    .rd-style-scope .rd-a4-footer {
      position: relative !important;
      inset: auto !important;
      flex: 0 0 ${DESIGNER_FOOTER_HEIGHT_MM}mm !important;
      height: ${DESIGNER_FOOTER_HEIGHT_MM}mm !important;
      min-height: ${DESIGNER_FOOTER_HEIGHT_MM}mm !important;
      max-height: ${DESIGNER_FOOTER_HEIGHT_MM}mm !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: flex-end !important;
      visibility: visible !important;
      opacity: 1 !important;
      overflow: visible !important;
      z-index: 20 !important;
    }
    .rd-style-scope .rd-selected-element {
      outline: 1px solid rgba(124, 58, 237, 0.55) !important;
      outline-offset: 2px;
      box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.08) !important;
    }
    .rd-style-scope .rd-numbering.rd-selected-element {
      outline: none !important;
      box-shadow: none !important;
      background-color: rgba(124, 58, 237, 0.10) !important;
      border-radius: 3px;
      padding: 0 1px;
    }
    .rd-style-scope td.rd-selected-element,
    .rd-style-scope th.rd-selected-element {
      outline: 1px solid rgba(124, 58, 237, 0.4) !important;
      outline-offset: -2px;
      box-shadow: none !important;
      background-color: rgba(124, 58, 237, 0.055) !important;
    }
    .rd-style-scope .rd-edited-text {
      background-color: rgba(253, 230, 138, 0.25);
    }
    .rd-style-scope .rd-structure-highlight {
      background-color: rgba(250, 204, 21, 0.14) !important;
      box-shadow: 0 0 0 2px rgba(202, 138, 4, 0.16) !important;
      border-radius: 4px;
      transition: background-color 160ms ease, box-shadow 160ms ease;
    }
    .rd-style-scope .rd-content-bounds {
      position: absolute;
      inset: ${boundsInset};
      display: ${s.showContentBounds ? 'block' : 'none'};
      border: 1.5px dashed #38bdf8;
      background: rgba(56, 189, 248, 0.035);
      pointer-events: none;
      z-index: 0;
    }
    .rd-style-scope .rd-safe-area {
      position: absolute;
      inset: 8mm;
      display: ${s.showSafeArea ? 'block' : 'none'};
      border: 1px solid rgba(34, 197, 94, 0.65);
      background:
        linear-gradient(45deg, rgba(34, 197, 94, 0.08) 25%, transparent 25%, transparent 50%, rgba(34, 197, 94, 0.08) 50%, rgba(34, 197, 94, 0.08) 75%, transparent 75%, transparent);
      background-size: 8px 8px;
      pointer-events: none;
      z-index: 0;
    }
    .rd-style-scope .rd-a4-page > :not(.rd-content-bounds):not(.rd-safe-area) {
      position: relative;
      z-index: 1;
    }
    .rd-style-scope .rd-fragment-reportTitle h1 {
      font-family: ${titleStack} !important;
      font-size: ${s.mainTitleFontSize}px !important;
      color: ${mainTitleColor} !important;
      font-weight: ${s.mainTitleWeight} !important;
    }
    .rd-style-scope .rd-numbering,
    .rd-style-scope .rd-fragment-assignment .section-num,
    .rd-style-scope .rd-fragment-committee .section-num,
    .rd-style-scope .rd-fragment-purpose .section-num,
    .rd-style-scope .rd-fragment-visitDate .section-num,
    .rd-style-scope .rd-fragment-summaryTables .section-num {
      font-size: ${s.numberingFontSize}px !important;
      color: ${numberingColor} !important;
      font-weight: ${s.numberingWeight} !important;
    }
    .rd-style-scope .rd-paragraph-text,
    .rd-style-scope .rd-fragment-narrative,
    .rd-style-scope .rd-fragment-inspectionDetailItem,
    .rd-style-scope .rd-fragment-assignment .section-body,
    .rd-style-scope .rd-fragment-committee .section-body,
    .rd-style-scope .rd-fragment-purpose .section-body,
    .rd-style-scope .rd-fragment-visitDate .section-body,
    .rd-style-scope .section-body {
      font-size: ${s.paragraphFontSize}px !important;
      color: ${paragraphColor} !important;
      line-height: ${s.paragraphLineHeight} !important;
    }
    .rd-style-scope table,
    .rd-style-scope .military-table {
      border-collapse: collapse !important;
      border-color: ${tableBorderColor} !important;
      border-width: ${s.tableBorderWidth}px !important;
      border-style: solid !important;
      font-size: ${s.tableFontSize}px !important;
      font-weight: ${s.tableFontWeight} !important;
    }
    .rd-style-scope table th,
    .rd-style-scope table td,
    .rd-style-scope .military-table th,
    .rd-style-scope .military-table td {
      border-color: ${tableBorderColor} !important;
      border-width: ${s.tableBorderWidth}px !important;
      border-style: solid !important;
      padding: ${tablePadding} !important;
      font-size: ${s.tableFontSize}px !important;
      font-weight: ${s.tableFontWeight} !important;
    }
    .rd-style-scope table thead tr,
    .rd-style-scope table thead th,
    .rd-style-scope .military-table thead tr,
    .rd-style-scope .military-table thead th {
      background-color: ${tableHeaderBackgroundColor} !important;
      color: ${tableHeaderTextColor} !important;
    }
    ${[1, 2, 3, 4].map((level) => {
      const lColor = s[`numberingLevel${level}Color` as keyof DesignerStyleState] as string;
      const lSize = s[`numberingLevel${level}FontSize` as keyof DesignerStyleState] as number;
      const lWeight = s[`numberingLevel${level}Weight` as keyof DesignerStyleState] as string;
      const colorVal = lColor && isHexColor(lColor) ? lColor : '';
      if (!colorVal && !lSize && (!lWeight || lWeight === 'normal')) return '';
      const rules: string[] = [];
      if (colorVal) rules.push(`color: ${colorVal} !important`);
      if (lSize && lSize > 0) rules.push(`font-size: ${lSize}px !important`);
      if (lWeight && lWeight !== 'normal') rules.push(`font-weight: ${lWeight} !important`);
      return `.rd-style-scope .rd-numbering[data-numbering-level="${level}"] {\n          ${rules.join(';\n          ')};\n        }`;
    }).filter(Boolean).join('\n    ')}
  `;
};

export const tableStyleToCss = (override: ElementStyleOverride): CSSProperties => {
    const style: CSSProperties = {};
    if (override.tableBorderColor) style.borderColor = override.tableBorderColor;
    if (override.tableBorderWidth !== undefined) style.borderWidth = `${override.tableBorderWidth}px`;
    if (override.tableBorderColor || override.tableBorderWidth !== undefined) style.borderStyle = 'solid';
    if (override.tableFontSize !== undefined) style.fontSize = `${override.tableFontSize}px`;
    if (override.tableFontWeight) style.fontWeight = override.tableFontWeight;
    return style;
  };

export const textStyleToCss = (type: SelectedElementType, override: ElementStyleOverride): CSSProperties => {
    const style: CSSProperties = {};
    if (type === 'mainTitle') {
      if (override.mainTitleFontFamily) style.fontFamily = FONT_STACKS[override.mainTitleFontFamily];
      if (override.mainTitleFontSize !== undefined) style.fontSize = `${override.mainTitleFontSize}px`;
      if (override.mainTitleColor) style.color = override.mainTitleColor;
      if (override.mainTitleWeight) style.fontWeight = override.mainTitleWeight;
      if (override.titleTextAlign) style.textAlign = override.titleTextAlign;
      if (override.titleSpacingBefore !== undefined) style.marginTop = `${override.titleSpacingBefore}px`;
      if (override.titleSpacingAfter !== undefined) style.marginBottom = `${override.titleSpacingAfter}px`;
    }
    if (type === 'numbering') {
      if (override.numberingFontSize !== undefined) style.fontSize = `${override.numberingFontSize}px`;
      if (override.numberingColor) style.color = override.numberingColor;
      if (override.numberingWeight) style.fontWeight = override.numberingWeight;
    }
    if (type === 'paragraph' || type === 'subheading') {
      if (override.paragraphFontSize !== undefined) style.fontSize = `${override.paragraphFontSize}px`;
      if (override.paragraphColor) style.color = override.paragraphColor;
      if (override.paragraphLineHeight !== undefined) style.lineHeight = String(override.paragraphLineHeight);
    }
    return style;
  };


const ARABIC_INDIC_DIGIT = '٠١٢٣٤٥٦٧٨٩';
const ASCII_DIGIT = '0-9';
const ALL_DIGITS = `${ASCII_DIGIT}${ARABIC_INDIC_DIGIT}`;

export const getNumberingLevelFromText = (text: string): 1 | 2 | 3 | 4 | null => {
  const trimmed = text.trim();
  if (new RegExp(`^[${ALL_DIGITS}]+\\.`).test(trimmed)) return 1;
  if (/^[أ-ي]\./.test(trimmed)) return 2;
  if (new RegExp(`^\\([${ALL_DIGITS}]+\\)`).test(trimmed)) return 3;
  if (/^\([أ-ي]\)/.test(trimmed)) return 4;
  return null;
};

export const detectNumberingLevel = (element: HTMLElement): 1 | 2 | 3 | 4 | null => {
    return getNumberingLevelFromText(element.textContent ?? '');
  };

