"use strict"; // Phase 52C Page 2 Overflow Full Diagnostic

import type { PageModel } from '../utils/paginate';

function runPhase52CAudit() {
  console.group('[Phase52C] Page 2 Overflow Full Diagnostic');

  // Find the designer preview container
  const previewRoot = document.querySelector<HTMLElement>('[data-phase52c-a4-preview]');
  if (!previewRoot) {
    console.error('[Phase52C] Phase52C_A4 preview container not found (data-phase52c-a4-preview)');
    return;
  }

  const a4Pages = Array.from(previewRoot.querySelectorAll<HTMLElement>('.rd-a4-page'));
  if (a4Pages.length < 2) {
    console.error('[Phase52C] Need at least 2 pages, found', a4Pages.length);
    return;
  }

  const page2 = a4Pages[1];
  console.log('[Phase52C] Page 2 element found:', page2);

  // Get all DOM measurements
  const page2Rect = page2.getBoundingClientRect();
  const page2Styles = window.getComputedStyle(page2);

  const content = page2.querySelector<HTMLElement>('.rd-a4-content');
  const contentRect = content?.getBoundingClientRect();
  const contentStyles = content ? window.getComputedStyle(content) : null;

  // Extract padding from .rd-a4-page
  const paddingTop = parseFloat(page2Styles.paddingTop || '0');
  const paddingRight = parseFloat(page2Styles.paddingRight || '0');
  const paddingBottom = parseFloat(page2Styles.paddingBottom || '0');
  const paddingLeft = parseFloat(page2Styles.paddingLeft || '0');

  // Available height for pagination (from paginate.ts)
  const MM_TO_PX = 96 / 25.4;
  const A4 = { widthMm: 210, heightMm: 297, margin: { top: 20, right: 10, bottom: 22, left: 10 } };
  const AVAILABLE_PX = (A4.heightMm - A4.margin.top - A4.margin.bottom) * MM_TO_PX;

  console.log('[Phase52C] === MEASUREMENTS ===');
  console.log('Page 2:')
  console.log('  - Page bottom:', page2Rect.bottom)
  console.log('  - Page height:', page2Rect.height)
  console.log('  - Page padding:', { top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft })
  console.log('  - Page box-sizing:', page2Styles.boxSizing)

  if (contentRect) {
    console.log('Content:')
    console.log('  - Content bottom:', contentRect.bottom)
    console.log('  - Content height:', contentRect.height)
    console.log('  - Content clientHeight:', content.clientHeight)
    console.log('  - Content scrollHeight:', content.scrollHeight)
    console.log('  - Content overflow:', contentStyles?.overflow)
    console.log('  - Content box-sizing:', contentStyles?.boxSizing)

    // Calculate overflow for both page and content
    const pageOverflowPx = Math.max(0, contentRect.bottom - page2Rect.bottom);
    const contentOverflowPx = Math.max(0, content.scrollHeight - content.clientHeight);

    console.log('[Phase52C] OVERFLOW CALCULATIONS:');
    console.log('  - Page overflow (content bottom - page bottom):', pageOverflowPx)
    console.log('  - Content overflow (scrollHeight - clientHeight):', contentOverflowPx)
  }

  console.log('[Phase52C] === PAGINATION MEASUREMENTS ===');
  // Check pagination measurements from window if available
  if ((window as any).availableHeightPx !== undefined) {
    console.log('  - Pagination AVAILABLE_PX (window):', (window as any).availableHeightPx)
  }
  if ((window as any).availableHeightPx) {
    const percentDiff = AVAILABLE_PX ? ((AVAILABLE_PX - (window as any).availableHeightPx) / AVAILABLE_PX * 100).toFixed(1) : 0;
    console.log('  - Expected AVAILABLE_PX (paginate.ts):', AVAILABLE_PX)
    console.log('  - Difference:', (window as any).availableHeightPx - AVAILABLE_PX)
    console.log('  - Variance %:', percentDiff + '%')
  }

  console.log('[Phase52C] === FRAGMENTS ON PAGE 2 ===');
  const fragments = Array.from(page2.querySelectorAll<HTMLElement>('[data-frag-id]'));
  console.log('  - Total fragments:', fragments.length)

  fragments.forEach((fragment, index) => {
    const fragmentRect = fragment.getBoundingClientRect();
    const fragmentId = fragment.dataset.fragId || `unknown-${index}`;
    const fragmentKind = fragment.dataset.fragKind || 'unknown';
    const labelArabic = fragment.dataset.fragLabelArabic || '';

    console.log(`\n  Fragment #${index}: ${fragmentId} (${fragmentKind})`);
    console.log(`    Label: ${labelArabic}`)
    console.log(`    - Position: y=${fragmentRect.y.toFixed(2)}, bottom=${fragmentRect.bottom.toFixed(2)}`)
    console.log(`    - Dimensions: height=${fragmentRect.height.toFixed(2)}, width=${fragmentRect.width.toFixed(2)}`)
    console.log(`    - fragment.clientHeight: ${fragment.clientHeight}`)
    console.log(`    - fragment.scrollHeight: ${fragment.scrollHeight}`)
    console.log(`    - fragment.offsetHeight: ${fragment.offsetHeight}`)

    if (contentRect) {
      const bottomOverflowPx = Math.max(0, fragmentRect.bottom - contentRect.bottom);
      const internalOverflowPx = Math.max(0, fragment.scrollHeight - fragment.clientHeight);
      const totalOverflowPx = Math.max(bottomOverflowPx, internalOverflowPx);

      console.log(`    - Bottom overflow to content: ${bottomOverflowPx.toFixed(2)}px`)
      console.log(`    - Internal overflow: ${internalOverflowPx.toFixed(2)}px`)
      console.log(`    - Total overflow: ${totalOverflowPx.toFixed(2)}px`)
      console.log(`    - Actual clipped: ${totalOverflowPx > 16}px`)
    }
  });

  console.log('[Phase52C] === PREFLIGHT LOGIC ANALYSIS ===');
  // Simulate what designerSnapshotPdfExport.ts checkOverflow does
  const OVERFLOW_TOLERANCE_PX = 16;

  if (contentRect) {
    const containerOverflowPx = Math.max(0, content.scrollHeight - content.clientHeight);
    const containerBottom = contentRect.bottom;

    console.log('  - Container overflowPx:', containerOverflowPx)
    console.log('  - Container clientHeight:', content.clientHeight)
    console.log('  - Container scrollHeight:', content.scrollHeight)
    console.log('  - Tolerance:', OVERFLOW_TOLERANCE_PX)

    const fragmentsHardOverflow = fragments.some((fragment) => {
      const bottomOverflowPx = Math.max(0, fragment.getBoundingClientRect().bottom - containerBottom);
      const internalOverflowPx = Math.max(0, fragment.scrollHeight - fragment.clientHeight);
      const fragmentOverflowPx = Math.max(bottomOverflowPx, internalOverflowPx);
      return fragmentOverflowPx > OVERFLOW_TOLERANCE_PX;
    });

    const isHardOverflow = containerOverflowPx > OVERFLOW_TOLERANCE_PX && fragmentsHardOverflow;
    const isBoundaryNoise = containerOverflowPx > OVERFLOW_TOLERANCE_PX && !fragmentsHardOverflow;

    console.log('  - Any fragment hard overflow >16px?', fragmentsHardOverflow)
    console.log('  - Is hard overflow (container + fragment) >16px?', isHardOverflow)
    console.log('  - Is boundary noise (only container) >16px?', isBoundaryNoise)

    if (isHardOverflow) {
      console.error('[Phase52C] ==> DETECTED HARD OVERFLOW (would block PDF export)')
    } else if (isBoundaryNoise) {
      console.warn('[Phase52C] ==> DETECTED BOUNDARY NOISE (would be ignored)')
    } else {
      console.log('[Phase52C] ==> NO HARD OVERFLOW DETECTED')
    }
  }

  console.groupEnd();
}

// Export for use in browser
window.runPhase52CAudit = runPhase52CAudit;