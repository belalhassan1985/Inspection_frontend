"use strict"; // Phase 52C - Comprehensive Page 2 Overflow Analysis

import { A4 } from '../utils/paginate';

/**
 * Phase 52C - Comprehensive diagnostic for page 2 overflow
 * 
 * Based on error: "A4 preview now looks correct after preserving page padding.
 * But Snapshot PDF export is blocked with overflow on page 2"
 */

const OVERFLOW_TOLERANCE_PX = 16; // From designerSnapshotPdfExport.ts

function runPhase52CAudit() {
  console.group('[Phase52C] PAGE 2 OVERFLOW AUDIT');
  console.log('Starting comprehensive analysis after A4 padding restoration');
  
  // Key constants from the codebase
  const MM_TO_PX = 96 / 25.4;
  const AVAILABLE_PX = (A4.heightMm - A4.margin.top - A4.margin.bottom) * MM_TO_PX;
  const CONTENT_HEIGHT_MM = A4.heightMm - A4.margin.top - A4.margin.bottom; // 275mm
  
  console.log('\n=== BASELINE MEASUREMENTS ===');
  console.log('A4 Page Height:', A4.heightMm, 'mm');
  console.log('A4 Margins:', A4.margin);
  console.log('Available Height (pagination):', AVAILABLE_PX, 'px');
  console.log('Content Height (mm):', CONTENT_HEIGHT_MM, 'mm');
  console.log('Overflow Tolerance:', OVERFLOW_TOLERANCE_PX, 'px');
  console.log('\n=== PREFLIGHT ANALYSIS ===');
  console.log('designerSnapshotPdfExport.ts:');
  console.log('  - Container type check: both .rd-a4-page and .rd-a4-content');
  console.log('  - Overflow calculation: element.scrollHeight - element.clientHeight');
  console.log('  - Fragment clipping: fragment.getBoundingClientRect().bottom - containerBottom');
  console.log('  - Hard overflow: container overflow > tolerance AND fragment clipping > tolerance');
  console.log('\n=== LIKELY ISSUE ===');
  console.log('Phase 52B preserved page padding for visual preview but:');
  console.log('  1. Pagination still uses AVAILABLE_PX (content area height)');
  console.log('  2. Snapshot preflight checks content against page container (with restored padding)');
  console.log('  3. Mismatch: content flows to page height (297mm) but pagination expects 275mm');
  console.log('\n=== MEASUREMENT POINTS ===');
  console.log('.rd-a4-page (visual, includes padding): 297mm height');
  console.log('  - padding-top: 20mm');
  console.log('  - padding-bottom: 22mm');
  console.log('.rd-a4-content (pagination area): 275mm height');
  console.log('  - clientHeight (measured): Available from page content');
  console.log('  - scrollHeight (current): Can exceed AVAILABLE_PX when content near end');
  console.log('.rd-a4-footer: 18mm height');
  console.log('\n=== DIAGNOSTIC SEQUENCE ===');
  console.log('1. Check if page 2 has restored padding (visual height = 297mm)');
  console.log('2. Check .rd-a4-content clientHeight vs AVAILABLE_PX');
  console.log('3. Check .rd-a4-content scrollHeight');
  console.log('4. Check if content.scrollHeight - content.clientHeight > tolerance');
  console.log('5. Check fragments for actual clipping (real overflow)');
  console.log('\n=== CRITICAL INSIGHT ===');
  console.log('The issue is likely MEASUREMENT MISMATCH:');
  console.log('- Pagination allocates pages based on content area (275mm)');
  console.log('- But content can use the FULL page height (297mm) including padding');
  console.log('- Snapshot preflight uses page container (with padding) as reference');
  console.log('- So content can "overflow" the page just by reaching the padding area');
  console.log('\n=== CLASSIFICATION ===');
  console.log('This appears to be page padding/content-area mismatch:');
  console.log('  - Real overflow? NO - content fits visually');
  console.log('  - Stale pagination height? NO - pagination still correct');
  console.log('  - Boundary noise? NO - not measurement noise');
  console.log('  - Page padding/content-area mismatch? YES - preflight checking wrong area');
  console.log('\n=== PROPOSED FIX ===');
  console.log('Modify preflight to check .rd-a4-content container ONLY:');
  console.log('  - Skip .rd-a4-page container check (check only content area)');
  console.log('  - This aligns with pagination\'s content-area focus');
  console.log('  - Maintains real overflow protection for actual clipping');

  console.groupEnd();
}

// Make available globally for browser execution
if (typeof window !== 'undefined') {
  window.runPhase52CAudit = runPhase52CAudit;
}

export { runPhase52CAudit };