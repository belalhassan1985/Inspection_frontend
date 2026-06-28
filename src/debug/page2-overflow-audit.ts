"use strict"; // Phase 52C - Page 2 Overflow Audit for Snapshot Preflight After A4 Padding Restore

import type { PageModel } from '../utils/paginate';

// Based on the issue:
// "A4 preview now looks correct after preserving page padding."
// "But Snapshot PDF export is blocked with:
// 'لا يمكن إنشاء PDF مطابق للمعاينة لأن بعض المحتوى يتجاوز حدود الصفحة. الصفحات: 2'"

// This happened after Phase 52B preserved page padding.

// The issue appears to be that after restoring A4 page padding:
// 1. The visual preview looks correct (content fits within padded pages)
// 2. But the Snapshot preflight detects overflow on page 2
// 3. This is likely because the preflight is checking against the wrong container
//    (full page vs content area) after padding was restored.

import { A4 } from './paginate';

// === CONSTANTS ===
const OVERFLOW_TOLERANCE_PX = 16;

// === STATE ===
interface Page2AuditState {
  isRunning: boolean;
  page2Element: HTMLElement | null;
  page2Rect: DOMRect | null;
  contentElement: HTMLElement | null;
  contentRect: DOMRect | null;
  fragments: HTMLElement[];
  measurements: {
    pagePadding: { top: number; right: number; bottom: number; left: number };
    contentClientHeight: number;
    contentScrollHeight: number;
    contentOverflowPx: number;
    pageOverflowPx: number;
    fragmentsOverflows: Array<{
      fragmentId: string;
      fragmentKind: string;
      labelArabic: string;
      bottomOverflowPx: number;
      internalOverflowPx: number;
      totalOverflowPx: number;
      hardOverflow: boolean;
    }>;
  };
}

// === UTILITIES ===
function getPagePadding(element: HTMLElement): { top: number; right: number; bottom: number; left: number } {
  const styles = window.getComputedStyle(element);
  return {
    top: parseFloat(styles.paddingTop || '0'),
    right: parseFloat(styles.paddingRight || '0'),
    bottom: parseFloat(styles.paddingBottom || '0'),
    left: parseFloat(styles.paddingLeft || '0'),
  };
}

function mmToPx(mm: number): number {
  return mm * (96 / 25.4);
}

// === MAIN AUDIT FUNCTION ===
export async function auditPage2Overflow(): Promise<Page2AuditState> {
  console.group('[Phase52C] Page 2 Overflow Audit');
  
  const state: Page2AuditState = {
    isRunning: true,
    page2Element: null,
    page2Rect: null,
    contentElement: null,
    contentRect: null,
    fragments: [],
    measurements: {
      pagePadding: { top: 0, right: 0, bottom: 0, left: 0 },
      contentClientHeight: 0,
      contentScrollHeight: 0,
      contentOverflowPx: 0,
      pageOverflowPx: 0,
      fragmentsOverflows: []
    }
  };

  try {
    // Find the designer preview container
    const previewRoot = document.querySelector<HTMLElement>('.rd-style-scope');
    if (!previewRoot) {
      console.error('[Phase52C] Could not find .rd-style-scope container');
      return state;
    }

    // Get all A4 pages
    const a4Pages = Array.from(previewRoot.querySelectorAll<HTMLElement>('.rd-a4-page'));
    if (a4Pages.length < 2) {
      console.error(`[Phase52C] Expected at least 2 pages, found ${a4Pages.length}`);
      return state;
    }

    // Focus on page 2
    const page2 = a4Pages[1];
    state.page2Element = page2;
    state.page2Rect = page2.getBoundingClientRect();
    
    console.log('[Phase52C] Page 2 element found:', page2);

    // Get the content element
    const content = page2.querySelector<HTMLElement>('.rd-a4-content');
    state.contentElement = content || null;
    if (content) {
      state.contentRect = content.getBoundingClientRect();
    }

    // Get page padding
    state.measurements.pagePadding = getPagePadding(page2);
    console.log('[Phase52C] Page 2 padding:', state.measurements.pagePadding);

    // Calculate pagination constants
    const expectedContentHeightPx = mmToPx(A4.heightMm - A4.margin.top - A4.margin.bottom);
    console.log('[Phase52C] Expected content height (from paginate.ts):', expectedContentHeightPx, 'px');
    console.log('[Phase52C] A4 margin:', A4.margin);

    if (content) {
      state.measurements.contentClientHeight = content.clientHeight;
      state.measurements.contentScrollHeight = content.scrollHeight;
      
      // Calculate content overflow
      state.measurements.contentOverflowPx = Math.max(0, content.scrollHeight - content.clientHeight);
      console.log('[Phase52C] Content height measurements:');
      console.log('  - clientHeight:', content.clientHeight);
      console.log('  - scrollHeight:', content.scrollHeight);
      console.log('  - overflow:', state.measurements.contentOverflowPx);

      // Get page overflow (content bottom relative to page bottom)
      if (state.contentRect) {
        state.measurements.pageOverflowPx = Math.max(0, state.contentRect.bottom - state.page2Rect.bottom);
        console.log('[Phase52C] Page overflow (content bottom - page bottom):', state.measurements.pageOverflowPx);
      }
    }

    // Get all fragments on page 2
    const fragments = Array.from(page2.querySelectorAll<HTMLElement>('[data-frag-id]'));
    state.fragments = fragments;

    // Analyze each fragment for overflow
    const fragmentsOverflows = fragments.map((fragment) => {
      const fragId = fragment.dataset.fragId || 'unknown';
      const fragKind = fragment.dataset.fragKind || 'unknown';
      const labelArabic = fragment.dataset.fragLabelArabic || '';
      
      const fragRect = fragment.getBoundingClientRect();
      const containerBottom = state.contentRect?.bottom || fragRect.bottom;
      
      const bottomOverflowPx = Math.max(0, fragRect.bottom - containerBottom);
      const internalOverflowPx = Math.max(0, fragment.scrollHeight - fragment.clientHeight);
      const totalOverflowPx = Math.max(bottomOverflowPx, internalOverflowPx);
      const hardOverflow = totalOverflowPx > OVERFLOW_TOLERANCE_PX;

      return {
        fragmentId: fragId,
        fragmentKind: fragKind,
        labelArabic: labelArabic,
        bottomOverflowPx: Math.round(bottomOverflowPx * 100) / 100,
        internalOverflowPx: Math.round(internalOverflowPx * 100) / 100,
        totalOverflowPx: Math.round(totalOverflowPx * 100) / 100,
        hardOverflow: hardOverflow
      };
    });

    state.measurements.fragmentsOverflows = fragmentsOverflows;

    // === PREFLIGHT ANALYSIS ===
    console.log('\n[Phase52C] === PREFLIGHT ANALYSIS ===');
    
    if (!state.contentElement) {
      console.error('[Phase52C] Could not find .rd-a4-content element');
    } else {
      // Simulate the preflight logic from designerSnapshotPdfExport.ts
      const hardOverflowDiagnostics = fragmentsOverflows.filter((f) => f.hardOverflow);
      const hasPageOverflow = state.measurements.pageOverflowPx > OVERFLOW_TOLERANCE_PX;
      const hasContentOverflow = state.measurements.contentOverflowPx > OVERFLOW_TOLERANCE_PX;
      
      console.log('[Phase52C] Preflight detection simulation:');
      console.log('  - Any fragment with >16px hard overflow:', hardOverflowDiagnostics.length > 0);
      console.log('  - Page overflow >16px:', hasPageOverflow);
      console.log('  - Content overflow >16px:', hasContentOverflow);
      
      if (hardOverflowDiagnostics.length > 0 || hasPageOverflow) {
        console.error('[Phase52C] ==> HARD OVERFLOW DETECTED (would block PDF export)')
        console.error('[Phase52C] Hard overflow fragments:', hardOverflowDiagnostics.map(f => f.fragmentId));
        if (hasPageOverflow) {
          console.error('[Phase52C] Page overflow:', state.measurements.pageOverflowPx, 'px');
        }
      } else {
        console.log('[Phase52C] ==> No hard overflow detected')
      }
    }

    // === WRITTEN QUESTIONS FOR DIAGNOSTIC ===
    console.log('\n[Phase52C] === DIAGNOSTIC QUESTIONS ===');
    console.log('1. Is page 2 truly overflowing visually in the A4 preview?');
    console.log('   - Page 2 height:', state.page2Rect?.height);
    console.log('   - Content fits within page?', state.contentRect ? state.contentRect.height <= state.page2Rect.height : 'N/A');
    console.log('   - Page padding accounted for:', state.measurements.pagePadding);
    
    console.log('\n2. Compare page 2 measurements:');
    console.log('   - .rd-a4-page padding:', state.measurements.pagePadding);
    console.log('   - .rd-a4-content clientHeight:', state.measurements.contentClientHeight);
    console.log('   - .rd-a4-content scrollHeight:', state.measurements.contentScrollHeight);
    console.log('   - overflowPx (content):', state.measurements.contentOverflowPx);
    console.log('   - overflowPx (page):', state.measurements.pageOverflowPx);
    console.log('   - Available height (paginate.ts):', expectedContentHeightPx);
    
    console.log('\n3. List fragments on page 2 and identify which fragment exceeds:');
    fragmentsOverflows.forEach((frag, idx) => {
      if (frag.hardOverflow) {
        console.log(`   - ${frag.fragmentId} (${frag.fragmentKind}): ${frag.totalOverflowPx}px overflow`);
      }
    });
    
    console.log('\n4. Determine whether pagination is still using old available height:');
    console.log('   - Current AVAILABLE_PX (calculated):', expectedContentHeightPx);
    console.log('   - Need to check window.availableHeightPx or similar');
    
    console.log('\n5. Determine whether Snapshot preflight should check content area:');
    console.log('   - Currently checks both .rd-a4-page and .rd-a4-content containers');
    console.log('   - After A4 padding restoration, page includes padding, content does not');
    
    console.log('\n6. Determine whether this is:');
    console.log('   - REAL OVERFLOW: Fragments are clipping');
    console.log('   - STALE PAGINATION HEIGHT: Content fits within visual page but preflight uses wrong dimensions');
    console.log('   - BOUNDARY NOISE or MISMATCH: Need more analysis');

    console.log('\n[Phase52C] === DETAILED FRAGMENT ANALYSIS ===');
    fragmentsOverflows.forEach((frag, idx) => {
      console.log(`   ${idx + 1}. ${frag.fragmentId} (${frag.fragmentKind}) - ${frag.labelArabic}`);
      console.log(`      Bottom Overflow: ${frag.bottomOverflowPx}px`);
      console.log(`      Internal Overflow: ${frag.internalOverflowPx}px`);
      console.log(`      Total Overflow: ${frag.totalOverflowPx}px`);
      console.log(`      Hard Overflow: ${frag.hardOverflow ? 'YES' : 'NO'}`);
    });

    return state;
  } catch (error) {
    console.error('[Phase52C] Error during audit:', error);
    return state;
  } finally {
    console.groupEnd();
    state.isRunning = false;
  }
}

// Make available globally for browser execution
if (typeof window !== 'undefined') {
  (window as any).auditPage2Overflow = auditPage2Overflow;
}