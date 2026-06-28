import type React from 'react';
import { toCssPropertyName } from './types';

export const applyCss = (element: HTMLElement, style: React.CSSProperties) => {
  Object.entries(style).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      element.style.setProperty(toCssPropertyName(key), String(value), 'important');
    }
  });
};

export const clearDesignerInlineStyle = (element: HTMLElement, options?: { preservePadding?: boolean }) => {
  const propertiesToClear = [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'color',
    'lineHeight',
    'borderColor',
    'borderWidth',
    'borderStyle',
    'backgroundColor',
    'display',
    'border',
  ];

  if (!options?.preservePadding) {
    propertiesToClear.push('padding');
  }

  propertiesToClear.forEach((prop) => {
    element.style[prop as any] = '';
  });
  element.classList.remove('rd-edited-text');
};
