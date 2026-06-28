import type { CSSProperties } from 'react';

export const panelControlStyle: CSSProperties = {
  width: '100%',
  minHeight: '34px',
  border: '1px solid #cbd5e1',
  borderRadius: '7px',
  padding: '6px 8px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
};

export const panelButtonStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: '7px',
  padding: '8px 10px',
  backgroundColor: '#ffffff',
  color: '#334155',
  cursor: 'pointer',
  fontWeight: 700,
};

export const shellPanelStyle: CSSProperties = {
  position: 'sticky',
  top: '24px',
  alignSelf: 'start',
  border: '1px solid #d7dee8',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
  maxHeight: 'calc(100vh - 32px)',
  overflowY: 'auto',
};

export const shellPanelHeaderStyle: CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
};

export const shellPanelTitleStyle: CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: '15px',
  fontWeight: 800,
};

export const shellPanelHintStyle: CSSProperties = {
  margin: '5px 0 0',
  color: '#64748b',
  fontSize: '12px',
  lineHeight: 1.6,
};
