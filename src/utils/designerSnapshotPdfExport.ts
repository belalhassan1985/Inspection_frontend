import { getFontEmbedCSS, toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const DEFAULT_PIXEL_RATIO = 2;
const OVERFLOW_TOLERANCE_PX = 16;
const PAGE_OVERFLOW_ERROR = 'لا يمكن إنشاء PDF مطابق للمعاينة لأن بعض المحتوى يتجاوز حدود الصفحة. الصفحات:';
const EDITING_CLASS_NAMES = [
  'rd-selected-element',
  'rd-structure-highlight',
  'rd-edited-text',
] as const;

const SNAPSHOT_EXCLUDED_SELECTOR = [
  '[data-snapshot-exclude="true"]',
  '.rd-content-bounds',
  '.rd-safe-area',
  '.rd-quick-edit-btn',
  '[role="menu"]',
  '[aria-hidden="true"]',
  '[data-editor-only="true"]',
  '[data-measure-sentinel]',
].join(',');

export interface DesignerSnapshotPdfProgress {
  completed: number;
  total: number;
}

export interface DesignerSnapshotPdfExportOptions {
  root: HTMLElement;
  filename: string;
  onProgress?: (progress: DesignerSnapshotPdfProgress) => void;
  pixelRatio?: number;
}

const nextPaint = () => new Promise<void>((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
});

const waitForImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(images.map(async (image) => {
    if (image.complete && image.naturalWidth > 0) return;
    try {
      await image.decode();
    } catch {
      throw new Error('تعذر تحميل إحدى صور المعاينة قبل إنشاء PDF.');
    }
  }));
};

const shouldIncludeNode = (node: HTMLElement) => {
  if (!(node instanceof Element)) return true;
  if (node.matches('.rd-a4-header, .rd-a4-footer')) return true;
  return !node.matches(SNAPSHOT_EXCLUDED_SELECTOR);
};

type SnapshotOverflowFragmentDiagnostic = {
  pageNumber: number;
  fragmentId: string;
  fragmentKind: string;
  labelArabic: string;
  scrollHeight: number;
  clientHeight: number;
  overflowPx: number;
  internalOverflowPx: number;
  bottomOverflowPx: number;
  rectTop: number;
  rectBottom: number;
  pageContentRectTop: number;
  pageContentRectBottom: number;
  hardOverflow: boolean;
};

type SnapshotOverflowDiagnostic = {
  pageNumber: number;
  containerType: 'page' | 'content';
  scrollHeight: number;
  clientHeight: number;
  overflowPx: number;
  hardOverflow: boolean;
  isBoundaryNoise: boolean;
  fragments: SnapshotOverflowFragmentDiagnostic[];
};

const findOverflowingPages = (pages: HTMLElement[]): SnapshotOverflowDiagnostic[] => pages.flatMap((page, index) => {
  const content = page.querySelector<HTMLElement>('.rd-a4-content');
  const pageNumber = Number(page.dataset.pageIndex ?? index) + 1;
  const containers: Array<{ type: 'content'; element: HTMLElement | null }> = [
    { type: 'content', element: content },
  ];

  return containers.flatMap(({ type, element }) => {
    if (!element) {
      return [];
    }

    const containerOverflowPx = Math.max(0, element.scrollHeight - element.clientHeight);
    const pageContentRect = element.getBoundingClientRect();

    // Check every fragment for actual clipping
    const fragments = Array.from(page.querySelectorAll<HTMLElement>('[data-frag-id]')).map((fragment) => {
      const fragmentRect = fragment.getBoundingClientRect();
      const bottomOverflowPx = Math.max(0, fragmentRect.bottom - pageContentRect.bottom);
      const internalOverflowPx = Math.max(0, fragment.scrollHeight - fragment.clientHeight);
      const fragmentOverflowPx = Math.max(bottomOverflowPx, internalOverflowPx);
      const fragmentHardOverflow = internalOverflowPx > OVERFLOW_TOLERANCE_PX;

      return {
        pageNumber,
        fragmentId: fragment.dataset.fragId || 'unknown',
        fragmentKind: fragment.dataset.fragKind || 'unknown',
        labelArabic: fragment.dataset.fragLabelArabic || '',
        scrollHeight: fragment.scrollHeight,
        clientHeight: fragment.clientHeight,
        overflowPx: Math.round(fragmentOverflowPx * 100) / 100,
        internalOverflowPx: Math.round(internalOverflowPx * 100) / 100,
        bottomOverflowPx: Math.round(bottomOverflowPx * 100) / 100,
        rectTop: Math.round(fragmentRect.top * 100) / 100,
        rectBottom: Math.round(fragmentRect.bottom * 100) / 100,
        pageContentRectTop: Math.round(pageContentRect.top * 100) / 100,
        pageContentRectBottom: Math.round(pageContentRect.bottom * 100) / 100,
        hardOverflow: fragmentHardOverflow,
      };
    });

    const anyFragmentHardOverflow = fragments.some((f) => f.hardOverflow);

    // Container/bottom overflow is non-blocking by itself. Only internal
    // fragment overflow can block snapshot export.
    const isHardOverflow = anyFragmentHardOverflow;
    const isBoundaryNoise = containerOverflowPx > OVERFLOW_TOLERANCE_PX && !anyFragmentHardOverflow;

    return [{
      pageNumber,
      containerType: type,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      overflowPx: containerOverflowPx,
      hardOverflow: isHardOverflow,
      isBoundaryNoise,
      fragments,
    }];
  });
});

const assertSnapshotHasNoClippedContent = (pages: HTMLElement[]) => {
  const allDiagnostics = findOverflowingPages(pages);
  const fragmentDiagnostics = allDiagnostics.flatMap((diagnostic) => diagnostic.fragments);
  const blockingDiagnostics = fragmentDiagnostics.filter(
    (diagnostic) => diagnostic.internalOverflowPx > OVERFLOW_TOLERANCE_PX,
  );
  const hardOverflowDiagnostics = allDiagnostics.filter((d) => d.hardOverflow);
  const boundaryNoiseDiagnostics = allDiagnostics.filter((d) => d.isBoundaryNoise);

  if (import.meta.env.DEV) {
    if (allDiagnostics.length > 0) {
      console.group('[Phase52E] SNAPSHOT PDF OVERFLOW INVESTIGATION');
      
      // Find page 2 diagnostics specifically
      const page2Diagnostics = allDiagnostics.filter((d) => d.pageNumber === 2);
      const hardPage2Diagnostics = hardOverflowDiagnostics.filter((d) => d.pageNumber === 2);
      
      console.log(`=== PAGE 2 ANALYSIS (${page2Diagnostics.length} total diagnostics) ===`);
      
      if (page2Diagnostics.length === 0) {
        console.log('No diagnostics for page 2');
      } else {
        // Detailed logging for each diagnostic
        page2Diagnostics.forEach((diag, idx) => {
          console.log(`\n--- Diagnostic ${idx + 1}: ${diag.containerType} container ---`);
          console.log(`Container type: ${diag.containerType}`);
          console.log(`ScrollHeight: ${diag.scrollHeight}px, ClientHeight: ${diag.clientHeight}px`);
          console.log(`Container overflow: ${diag.overflowPx}px`);
          console.log(`Hard overflow: ${diag.hardOverflow}, Boundary noise: ${diag.isBoundaryNoise}`);
          
          // Get the actual page element for measurements
          const page = pages.find((p, i) => i === diag.pageNumber - 1);
          if (page) {
            const pageStyles = window.getComputedStyle(page);
            const pagePadding = {
              top: parseFloat(pageStyles.paddingTop || '0'),
              right: parseFloat(pageStyles.paddingRight || '0'),
              bottom: parseFloat(pageStyles.paddingBottom || '0'),
              left: parseFloat(pageStyles.paddingLeft || '0'),
            };
            console.log(`Page ${diag.pageNumber} padding (px): ${JSON.stringify(pagePadding, null, 2)}`);
            
            const content = page.querySelector<HTMLElement>('.rd-a4-content');
            if (content) {
              const contentRect = content.getBoundingClientRect();
              console.log(`Content element details:`);
              console.log(`  - Content clientHeight: ${content.clientHeight}px`);
              console.log(`  - Content scrollHeight: ${content.scrollHeight}px`);
              console.log(`  - Content rect: y=${contentRect.y.toFixed(2)}, bottom=${contentRect.bottom.toFixed(2)}px`);
              console.log(`  - Content overflow: ${content.scrollHeight - content.clientHeight}px`);
              console.log(`  - Content overflow tolerance: ${content.scrollHeight - content.clientHeight > OVERFLOW_TOLERANCE_PX ? '+' : ''}${content.scrollHeight - content.clientHeight}px`);
              
              // Check fragments on this page
              const fragments = Array.from(page.querySelectorAll<HTMLElement>('[data-frag-id]'));
              console.log(`Fragments on page ${diag.pageNumber}: ${fragments.length}`);
              
              fragments.forEach((fragment, fragIdx) => {
                const fragId = fragment.dataset.fragId || 'unknown';
                const fragKind = fragment.dataset.fragKind || 'unknown';
                const fragLabel = fragment.dataset.fragLabelArabic || '';
                const fragRect = fragment.getBoundingClientRect();
                const fragClientHeight = fragment.clientHeight;
                const fragScrollHeight = fragment.scrollHeight;
                const internalOverflowPx = Math.max(0, fragScrollHeight - fragClientHeight);
                const bottomOverflowPx = Math.max(0, fragRect.bottom - contentRect.bottom);
                const fragmentOverflowPx = Math.max(bottomOverflowPx, internalOverflowPx);
                const isHardOverflow = internalOverflowPx > OVERFLOW_TOLERANCE_PX;
                
                console.log(`  Fragment ${fragIdx + 1}: ${fragId} (${fragKind}) - ${fragLabel}`);
                console.log(`    - Fragment rect: y=${fragRect.y.toFixed(2)}, bottom=${fragRect.bottom.toFixed(2)}px`);
                console.log(`    - Page content rect: top=${contentRect.top.toFixed(2)}, bottom=${contentRect.bottom.toFixed(2)}px`);
                console.log(`    - Fragment internal: clientHeight=${fragClientHeight}px, scrollHeight=${fragScrollHeight}px`);
                console.log(`    - Fragment internal overflow: ${internalOverflowPx > 0 ? '+' : ''}${internalOverflowPx}px`);
                console.log(`    - Bottom overflow: ${bottomOverflowPx > 0 ? '+' : ''}${bottomOverflowPx}px`);
                console.log(`    - Total fragment overflow: ${fragmentOverflowPx > 0 ? '+' : ''}${fragmentOverflowPx}px`);
                if (!isHardOverflow && bottomOverflowPx > OVERFLOW_TOLERANCE_PX) {
                  console.log('    - Fragment bottom overflow detected but internal overflow=0 — non-blocking');
                } else {
                  console.log(`    - Fragment hard overflow: ${isHardOverflow ? 'YES' : 'NO'} (internal >${OVERFLOW_TOLERANCE_PX}px)`);
                }
                
                if (isHardOverflow) {
                  console.log(`    *** THIS FRAGMENT IS HARD OVERFLOW BLOCKING ***`);
                }
              });
            }
          }
          
          // Show which check caused hard overflow
          if (diag.hardOverflow) {
            console.log(`=== HARD OVERFLOW DETECTED FOR PAGE ${diag.pageNumber} ===`);
            console.log('Cause: At least one fragment has internal scrollHeight overflow > tolerance');
            console.log(`Container overflow: ${diag.overflowPx}px (> ${OVERFLOW_TOLERANCE_PX}px: ${diag.overflowPx > OVERFLOW_TOLERANCE_PX})`);
            console.log(`Has hard fragments: ${diag.fragments.some((f) => f.hardOverflow)}`);
            console.log(`Fragment hard overflows: [${diag.fragments.filter((f) => f.hardOverflow).map(f => f.fragmentId).join(', ')}]`);
          }
        });
        
        console.log('\n=== SUMMARY ===');
        if (hardPage2Diagnostics.length > 0) {
          console.error(`PAGE 2 IS BLOCKING PDF EXPORT: ${hardPage2Diagnostics.length} hard overflow diagnostic(s)`);
          hardPage2Diagnostics.forEach((diag, idx) => {
            console.error(`  Block ${idx + 1}: ${diag.containerType} container, overflow=${diag.overflowPx}px`);
          });
        }
        if (boundaryNoiseDiagnostics.length > 0) {
          console.log(`Page 2 boundary noise: ${boundaryNoiseDiagnostics.filter(d => d.pageNumber === 2).length} diagnostic(s)`);
        }
        
        console.groupEnd();
      }
    }
  }

  // Filter hard overflow diagnostics to only include those with actual fragment hard overflow
  // Container-only overflow should be boundary noise, not hard overflow (Phase 52F fix)
  const trueHardOverflowDiagnostics = hardOverflowDiagnostics.filter((d) => d.fragments.some((f) => f.hardOverflow));
  const effectiveBoundaryNoiseDiagnostics = boundaryNoiseDiagnostics.filter((d) => d.fragments.some((f) => f.hardOverflow));

  if (import.meta.env.DEV) {
    if (trueHardOverflowDiagnostics.length !== hardOverflowDiagnostics.length || effectiveBoundaryNoiseDiagnostics.length !== boundaryNoiseDiagnostics.length) {
      console.group('[Phase52F] FILTERING SUMMARY');
      console.log(`Total hard overflow diagnostics: ${hardOverflowDiagnostics.length}`);
      console.log(`True hard overflow diagnostics (with fragment clipping): ${trueHardOverflowDiagnostics.length}`);
      console.log(`Remaining container-only overflow: ${hardOverflowDiagnostics.length - trueHardOverflowDiagnostics.length}`);
      console.log(`Total boundary noise diagnostics: ${boundaryNoiseDiagnostics.length}`);
      console.log(`Effective boundary noise (with fragment clipping): ${effectiveBoundaryNoiseDiagnostics.length}`);
      console.log(`Remaining true boundary noise: ${boundaryNoiseDiagnostics.length - effectiveBoundaryNoiseDiagnostics.length}`);
      console.groupEnd();
    }

    fragmentDiagnostics
      .filter((diagnostic) => (
        diagnostic.bottomOverflowPx > OVERFLOW_TOLERANCE_PX
        && diagnostic.internalOverflowPx <= OVERFLOW_TOLERANCE_PX
      ))
      .forEach((diagnostic) => {
        console.log('Fragment bottom overflow detected but internal overflow=0 — non-blocking', {
          fragmentId: diagnostic.fragmentId,
          fragmentKind: diagnostic.fragmentKind,
          labelArabic: diagnostic.labelArabic,
          clientHeight: diagnostic.clientHeight,
          scrollHeight: diagnostic.scrollHeight,
          overflowPx: diagnostic.overflowPx,
          rectTop: diagnostic.rectTop,
          rectBottom: diagnostic.rectBottom,
          pageContentRectTop: diagnostic.pageContentRectTop,
          pageContentRectBottom: diagnostic.pageContentRectBottom,
          internalOverflowPx: diagnostic.internalOverflowPx,
          bottomOverflowPx: diagnostic.bottomOverflowPx,
          overflowCause: 'bottom overflow only',
        });
      });
  }

  if (blockingDiagnostics.length === 0) return;

  if (import.meta.env.DEV) {
    blockingDiagnostics.forEach((diagnostic) => {
      console.error('[Phase52F-2] Blocking fragment internal overflow', {
        fragmentId: diagnostic.fragmentId,
        fragmentKind: diagnostic.fragmentKind,
        labelArabic: diagnostic.labelArabic,
        clientHeight: diagnostic.clientHeight,
        scrollHeight: diagnostic.scrollHeight,
        overflowPx: diagnostic.overflowPx,
        rectTop: diagnostic.rectTop,
        rectBottom: diagnostic.rectBottom,
        pageContentRectTop: diagnostic.pageContentRectTop,
        pageContentRectBottom: diagnostic.pageContentRectBottom,
        internalOverflowPx: diagnostic.internalOverflowPx,
        bottomOverflowPx: diagnostic.bottomOverflowPx,
        overflowCause: 'internal scrollHeight overflow',
      });
    });
  }

  const pageNumbers = [...new Set(blockingDiagnostics.map((diagnostic) => diagnostic.pageNumber))]
    .map((pageNumber) => new Intl.NumberFormat('ar-IQ').format(pageNumber))
    .join('، ');
  throw new Error(`${PAGE_OVERFLOW_ERROR} ${pageNumbers}.`);
}

function clearPhase52FDiagnostics() {
  // This function ensures any leftover Phase 52F debug data is cleared
  console.clear();
  if (import.meta.env.DEV) {
    console.groupCollapsed('[Phase52F] Debug cleanup complete');
    console.log('Diagnostics filtering applied: only fragment hard overflow blocks export');
    console.groupEnd();
  }
}

export { clearPhase52FDiagnostics };

/**
 * Captures the existing Designer A4 pages as raster images, one page at a time.
 * This deliberately does not use or alter the official export pipeline.
 */
export const exportDesignerSnapshotPdf = async ({
  root,
  filename,
  onProgress,
  pixelRatio = DEFAULT_PIXEL_RATIO,
}: DesignerSnapshotPdfExportOptions): Promise<void> => {
  const pages = Array.from(root.querySelectorAll<HTMLElement>('.rd-a4-page'));
  if (pages.length === 0) {
    throw new Error('لا توجد صفحات معاينة جاهزة للتصدير.');
  }
  if (pages.some((page) => !page.querySelector('.rd-a4-footer'))) {
    throw new Error('تعذر العثور على تذييل إحدى صفحات المعاينة.');
  }

  if ('fonts' in document) {
    await document.fonts.ready;
  }
  await waitForImages(root);
  await nextPaint();
  assertSnapshotHasNoClippedContent(pages);

  const editingClassElements = EDITING_CLASS_NAMES.map((className) => ({
    className,
    elements: Array.from(root.querySelectorAll<HTMLElement>(`.${className}`)),
  }));
  editingClassElements.forEach(({ className, elements }) => {
    elements.forEach((element) => element.classList.remove(className));
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  try {
    const fontEmbedCSS = await getFontEmbedCSS(pages[0]);
    onProgress?.({ completed: 0, total: pages.length });

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const captureWidthPx = page.offsetWidth;
      const captureHeightPx = Math.round(captureWidthPx * (A4_HEIGHT_MM / A4_WIDTH_MM));
      await nextPaint();

      const canvas = await toCanvas(page, {
        backgroundColor: '#ffffff',
        cacheBust: false,
        filter: shouldIncludeNode,
        fontEmbedCSS,
        height: captureHeightPx,
        pixelRatio,
        style: {
          border: '0',
          boxShadow: 'none',
          height: `${A4_HEIGHT_MM}mm`,
          margin: '0',
          maxHeight: `${A4_HEIGHT_MM}mm`,
          minHeight: `${A4_HEIGHT_MM}mm`,
          outline: 'none',
          overflow: 'hidden',
          width: `${A4_WIDTH_MM}mm`,
        },
        width: captureWidthPx,
      });

      if (index > 0) pdf.addPage('a4', 'portrait');
      pdf.addImage(canvas, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');

      canvas.width = 1;
      canvas.height = 1;
      onProgress?.({ completed: index + 1, total: pages.length });
    }

    pdf.save(filename);
  } finally {
    editingClassElements.forEach(({ className, elements }) => {
      elements.forEach((element) => element.classList.add(className));
    });
  }
};
