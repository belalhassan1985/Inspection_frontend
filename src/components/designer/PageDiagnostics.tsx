import React from 'react';
import type { PageModel } from '../../utils/paginate';

const formatPx = (value: number): string => `${Math.round(value)}px`;

export const PageDiagnostics: React.FC<{
  pages: PageModel[];
}> = ({ pages }) => {
  if (pages.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: '20px',
        padding: '14px',
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
      }}
    >
      <strong style={{ display: 'block', marginBottom: '10px', color: '#334155' }}>
        تشخيص الصفحات - قراءة فقط
      </strong>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            lineHeight: 1.7,
            color: '#334155',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#e2e8f0' }}>
              <th style={cellStyle}>الصفحة</th>
              <th style={cellStyle}>Break Reason</th>
              <th style={cellStyle}>Fragments</th>
              <th style={cellStyle}>أول Fragment ID</th>
              <th style={cellStyle}>آخر Fragment ID</th>
              <th style={cellStyle}>أول Kind</th>
              <th style={cellStyle}>آخر Kind</th>
              <th style={cellStyle}>Estimated</th>
              <th style={cellStyle}>Available</th>
              <th style={cellStyle}>Remaining</th>
              <th style={cellStyle}>Oversized</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.pageNumber}>
                <td style={cellStyle}>{page.pageNumber}</td>
                <td style={cellStyle}>{page.breakReason}</td>
                <td style={cellStyle}>{page.fragments.length}</td>
                <td style={cellStyle}>{page.startFragmentId || '-'}</td>
                <td style={cellStyle}>{page.endFragmentId || '-'}</td>
                <td style={cellStyle}>{page.startFragmentKind || '-'}</td>
                <td style={cellStyle}>{page.endFragmentKind || '-'}</td>
                <td style={cellStyle}>{formatPx(page.estimatedHeight)}</td>
                <td style={cellStyle}>{formatPx(page.availableHeight)}</td>
                <td style={cellStyle}>{formatPx(page.remainingHeight)}</td>
                <td style={cellStyle}>{page.oversized ? 'نعم' : 'لا'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const cellStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  padding: '6px 8px',
  textAlign: 'right',
  verticalAlign: 'top',
  whiteSpace: 'nowrap',
};
