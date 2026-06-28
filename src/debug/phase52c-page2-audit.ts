"use strict"; // Phase 52C Page 2 Overflow Audit Script
// Audit page 2 overflow only after A4 padding restoration

import type { PageModel } from '../utils/paginate';

function auditPage2Overflow() {
  console.group('[Phase52C] Page 2 Overflow Audit');

  // Find the designer preview container
  const previewRoot = document.querySelector<HTMLElement>('[data-phase52c-a4-preview]');
  if (!previewRoot) {
    console.error('[Phase52C] Phase52C_A4 preview container not found (data-phase52c-a4-preview)');
    return;
  }

  const a4Pages = Array.from(previewRoot.querySelectorAll<HTMLElement>('.rd-a4-page'));
  const page2 = a4Pages[1];
  if (!page2) {
    console.error('[Phase52C] Page 2 not found');
    return;
  }

  // Get page2 dimensions
  const page2Rect = page2.getBoundingClientRect();
  const page2Styles = window.getComputedStyle(page2);

  // Extract padding from .rd-a4-page
  const paddingTop = parseFloat(page2Styles.paddingTop || '0');
  const paddingRight = parseFloat(page2Styles.paddingRight || '0');
  const paddingBottom = parseFloat(page2Styles.paddingBottom || '0');
  const paddingLeft = parseFloat(page2Styles.paddingLeft || '0');

  // Extract client content area
  const content = page2.querySelector<HTMLElement>('.rd-a4-content');
  const contentRect = content?.getBoundingClientRect();
  const contentStyles = content ? window.getComputedStyle(content) : null;

  // Calculate measurements
  const measurements = {
    pageNumber: 2,
    pageRect: {
      x: page2Rect.x,
      y: page2Rect.y,
      width: page2Rect.width,
      height: page2Rect.height,
      bottom: page2Rect.bottom,
    },
    pageStyles: {
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      boxSizing: page2Styles.boxSizing,
      background: page2Styles.background,
    },
    contentRect: contentRect
      ? {
          x: contentRect.x,
          y: contentRect.y,
          width: contentRect.width,
          height: contentRect.height,
          bottom: contentRect.bottom,
        }
      : null,
    contentStyles: contentStyles
      ? {
          overflow: contentStyles.overflow,
          overflowX: contentStyles.overflowX,
          overflowY: contentStyles.overflowY,
          height: contentStyles.height,
          maxHeight: contentStyles.maxHeight,
          minHeight: contentStyles.minHeight,
          boxSizing: contentStyles.boxSizing,
        }
      : null,
  };

  console.log('[Phase52C] Page 2 measurements:', measurements);

  // Check for real visual overflow
  if (contentRect) {
    const pageBottom = page2Rect.bottom;
    const contentBottom = contentRect.bottom;
    const potentialOverflowPx = Math.max(0, contentBottom - pageBottom);

    console.log(`[Phase52C] Visual overflow check:`);
    console.log(`  - Page bottom: ${pageBottom.toFixed(2)}px`);
    console.log(`  - Content bottom: ${contentBottom.toFixed(2)}px`);
    console.log(`  - Potential overflow: ${potentialOverflowPx.toFixed(2)}px`);
    console.log(`  - Visually overflowing: ${potentialOverflowPx > 2}px`);
  }

  // Get fragments on page 2
  const fragments = Array.from(page2.querySelectorAll<HTMLElement>('[data-frag-id]'));
  const fragmentDiagnostics = fragments.map((fragment) => {
    const fragmentRect = fragment.getBoundingClientRect();
    const fragmentStyles = window.getComputedStyle(fragment);
    const fragmentId = fragment.dataset.fragId || 'unknown';
    const fragmentKind = fragment.dataset.fragKind || 'unknown';
    const labelArabic = fragment.dataset.fragLabelArabic || '';

    // Internal overflow (if fragment has its own scrolling)
    const internalOverflowPx = Math.max(0, fragment.scrollHeight - fragment.clientHeight);

    return {
      fragmentId,
      fragmentKind,
      labelArabic,
      fragmentRect: {
        x: fragmentRect.x,
        y: fragmentRect.y,
        width: fragmentRect.width,
        height: fragmentRect.height,
        bottom: fragmentRect.bottom,
      },
      internalOverflowPx: Math.round(internalOverflowPx * 100) / 100,
    };
  });

  console.log(`[Phase52C] Fragments on page 2 (${fragments.length}):`);
  fragmentDiagnostics.forEach((f) => {
    console.log(`  - ${f.fragmentId} (${f.fragmentKind}):`);
    console.log(`    Label: ${f.labelArabic}`);
    console.log(`    Bottom: ${f.fragmentRect.bottom.toFixed(2)}px`);
    console.log(`    Height: ${f.fragmentRect.height.toFixed(2)}px`);
    console.log(`    Internal overflow: ${f.internalOverflowPx}px`);
  });

  console.groupEnd();

  return { measurements, fragments: fragmentDiagnostics };
}

// Export for use in browser
window.auditPage2Overflow = auditPage2Overflow;