import type { DesignerStyleState } from './types';

export const buildOfficialExportFormattingConfig = (styleState: DesignerStyleState): Record<string, unknown> => {
  const pageMarginToDensity: Record<string, string> = {
    narrow: 'compact',
    normal: 'normal',
    wide: 'comfortable',
  };

  return {
    fontFamily: styleState.mainTitleFontFamily,
    baseFontSize: styleState.paragraphFontSize,
    titleColor: styleState.mainTitleColor,
    titleFontSize: styleState.mainTitleFontSize,
    titleFontWeight: styleState.mainTitleWeight,
    numberingColor: styleState.numberingColor,
    tableBorderColor: styleState.tableBorderColor,
    tableHeaderBg: styleState.tableHeaderBackgroundColor,
    tableCellPadding: styleState.tableCellPadding,
    density: pageMarginToDensity[styleState.pageMargin],

    // Phase 19B: Global numbering level styles
    numberingLevel1Color: styleState.numberingLevel1Color,
    numberingLevel1FontSize: styleState.numberingLevel1FontSize,
    numberingLevel1Weight: styleState.numberingLevel1Weight,

    numberingLevel2Color: styleState.numberingLevel2Color,
    numberingLevel2FontSize: styleState.numberingLevel2FontSize,
    numberingLevel2Weight: styleState.numberingLevel2Weight,

    numberingLevel3Color: styleState.numberingLevel3Color,
    numberingLevel3FontSize: styleState.numberingLevel3FontSize,
    numberingLevel3Weight: styleState.numberingLevel3Weight,

    numberingLevel4Color: styleState.numberingLevel4Color,
    numberingLevel4FontSize: styleState.numberingLevel4FontSize,
    numberingLevel4Weight: styleState.numberingLevel4Weight,
  };
};
