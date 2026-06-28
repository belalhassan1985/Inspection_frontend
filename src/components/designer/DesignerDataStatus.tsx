import React from 'react';
import type { Fragment } from '../../utils/reportFragments';
import { BlockMeasurer } from './BlockMeasurer';
import type { DesignerStyleState, ElementStyleOverride } from './types';

export type DesignerDataStatusProps = {
  loading: boolean;
  reportPayload: any;
  error: string;
  fragments: Fragment[];
  heights: Map<string, number> | null;
  setHeights: React.Dispatch<React.SetStateAction<Map<string, number> | null>>;
  setAvailableContentHeightPx: React.Dispatch<React.SetStateAction<number | null>>;
  styleState: DesignerStyleState;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  elementTextOverrides: Record<string, string>;
  manualPageBreaks: string[];
};

export const DesignerDataStatus: React.FC<DesignerDataStatusProps> = ({
  loading,
  reportPayload,
  error,
  fragments,
  heights,
  setHeights,
  setAvailableContentHeightPx,
  styleState,
  elementStyleOverrides,
  elementTextOverrides,
  manualPageBreaks,
}) => {
  const handleMeasured = React.useCallback((result: {
    heights: Map<string, number>;
    availableContentHeightPx: number;
  }) => {
    setAvailableContentHeightPx(result.availableContentHeightPx);
    setHeights(result.heights);
  }, [setAvailableContentHeightPx, setHeights]);

  return (
    <>
    {loading && <div style={{ padding: '40px', textAlign: 'center' }}>جار التحميل...</div>}

    {/* حاوية القياس الخفية */}
    {reportPayload && fragments.length > 0 && !heights && (
      <BlockMeasurer
        fragments={fragments}
        styleState={styleState}
        elementStyleOverrides={elementStyleOverrides}
        elementTextOverrides={elementTextOverrides}
        manualPageBreaks={manualPageBreaks}
        reportPayload={reportPayload}
        onMeasured={handleMeasured}
      />
    )}

    {reportPayload && !heights && !loading && (
      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>جاري قياس المحتوى...</div>
    )}

    {!loading && !reportPayload && !error && (
      <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
        اختر حملة من القائمة أعلاه لعرض توزيع تقريرها على صفحات A4.
      </div>
    )}
    </>
  );
};
