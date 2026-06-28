import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface FloatingActionCardProps {
  position: { top: number; left: number };
  onOpenInspector: () => void;
  onClose: () => void;
}

const btnBase: React.CSSProperties = {
  border: '1px solid #a5b4fc',
  borderRadius: '8px',
  padding: '10px 16px',
  backgroundColor: '#eef2ff',
  color: '#4338ca',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '13px',
  textAlign: 'center',
  fontFamily: 'inherit',
  transition: 'background-color 0.1s',
  whiteSpace: 'nowrap',
};

export const FloatingActionCard: React.FC<FloatingActionCardProps> = ({
  position,
  onOpenInspector,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const raf = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={cardRef}
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: `${Math.max(8, position.top)}px`,
        left: `${Math.max(8, position.left)}px`,
        zIndex: 10000,
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <button
        type="button"
        onMouseDown={(e) => {
          e.stopPropagation();
          onOpenInspector();
          onClose();
        }}
        style={btnBase}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c7d2fe'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eef2ff'; }}
      >
        فتح محرر الملاحظات
      </button>
    </div>,
    document.body
  );
};
