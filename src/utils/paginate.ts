import type { Fragment, FragmentKind } from './reportFragments';

/**
 * paginate — خوارزمية التوزيع التراكمي (حساب بحت) للـ Paginator التجريبي.
 *
 * تجريبي (المرحلة 1)، قراءة فقط. تأخذ شظايا + ارتفاعاتها المقاسة من DOM، وتوزّعها على
 * صفحات A4 دون قصّ أو إخفاء أي محتوى.
 *
 * ضمانات:
 *   - كل شظية تُوضع في صفحة ما (الثابت: عدد شظايا الإدخال = مجموع شظايا الإخراج).
 *   - شظية أطول من الصفحة المتاحة → صفحة خاصة + تحذير (حارس الشظية العملاقة). لا قصّ.
 *   - احترام keepWithNext (العنوان يُجرّ مع تابعه) و keepTogether (atomic لا يُكسر).
 */

export const MM_TO_PX = 96 / 25.4;

export const A4 = {
  widthMm: 210,
  heightMm: 297,
  margin: { top: 20, right: 10, bottom: 22, left: 10 },
};

export const CONTENT_WIDTH_MM = A4.widthMm - A4.margin.left - A4.margin.right; // 190mm
export const CONTENT_HEIGHT_PX = (A4.heightMm - A4.margin.top - A4.margin.bottom) * MM_TO_PX;
export const AVAILABLE_PX = CONTENT_HEIGHT_PX;

export type BreakReason =
  | 'firstPage'
  | 'overflow'
  | 'keepWithNext'
  | 'keepTogether'
  | 'oversized'
  | 'manual';

export type PageModel = {
  pageNumber: number;
  breakReason: BreakReason;
  fragments: Fragment[];
  fragmentIds: string[];
  startFragmentId: string | null;
  endFragmentId: string | null;
  startFragmentKind: FragmentKind | null;
  endFragmentKind: FragmentKind | null;
  estimatedHeight: number;
  availableHeight: number;
  remainingHeight: number;
  oversized: boolean;
};

export type PaginatedPage = PageModel & {
  /** Compatibility alias for the existing A4PageCanvas renderer. */
  items: Fragment[];
};

export type PaginationWarning = {
  fragId: string;
  type: 'oversized';
  message: string;
  page: number;
};

export type PaginationResult = {
  pages: PaginatedPage[];
  warnings: PaginationWarning[];
};

export const paginate = (
  fragments: Fragment[],
  heights: Map<string, number>,
  availablePx: number = AVAILABLE_PX,
  manualPageBreakIds: string[] = []
): PaginationResult => {
  const pages: PaginatedPage[] = [];
  const warnings: PaginationWarning[] = [];
  const manualSet = new Set(manualPageBreakIds);

  let current: Fragment[] = [];
  let used = 0;
  let currentBreakReason: BreakReason = 'firstPage';

  // Track the most recent repeatHeader fragment so we can inject it at the top of a new page.
  let pendingRepeatHeader: Fragment | null = null;

  const buildPageModel = (
    items: Fragment[],
    oversized: boolean,
    breakReason: BreakReason
  ): PaginatedPage => {
    const estimatedHeight = items.reduce((sum, item) => sum + (heights.get(item.id) ?? 0), 0);
    const first = items[0] ?? null;
    const last = items[items.length - 1] ?? null;

    return {
      pageNumber: pages.length + 1,
      breakReason,
      fragments: items,
      items,
      fragmentIds: items.map((item) => item.id),
      startFragmentId: first?.id ?? null,
      endFragmentId: last?.id ?? null,
      startFragmentKind: first?.kind ?? null,
      endFragmentKind: last?.kind ?? null,
      estimatedHeight,
      availableHeight: availablePx,
      remainingHeight: Math.max(availablePx - estimatedHeight, 0),
      oversized,
    };
  };

  const flush = () => {
    if (current.length > 0) {
      pages.push(buildPageModel(current, false, currentBreakReason));
      current = [];
      used = 0;
    }
  };

  for (let i = 0; i < fragments.length; i++) {
    const f = fragments[i];
    const h = heights.get(f.id) ?? 0;

    // Track repeatHeader fragments for potential injection on page breaks.
    if (f.repeatHeader) {
      pendingRepeatHeader = f;
    }

    // Clear pendingRepeatHeader when we leave the table (non-table fragment).
    if (pendingRepeatHeader && f.kind !== 'summaryTableHeader' && f.kind !== 'summaryTableRow') {
      pendingRepeatHeader = null;
    }

    // حارس الشظية العملاقة: أطول من صفحة كاملة → صفحة خاصة + تحذير، بلا قصّ.
    if (h > availablePx) {
      flush();
      pages.push(buildPageModel([f], true, pages.length === 0 ? 'firstPage' : 'oversized'));
      currentBreakReason = 'overflow';
      warnings.push({
        fragId: f.id,
        type: 'oversized',
        message: `العنصر «${f.title}» أطول من صفحة A4 ويحتاج تقسيماً داخلياً لاحقاً.`,
        page: pages.length,
      });
      continue;
    }

    // Manual page break: إذا كانت الشظية الحالية في manualPageBreakIds
    // وتلي شظايا سابقة (أي ليست أول عنصر في الصفحة الأولى الفارغة)
    if (manualSet.has(f.id) && (current.length > 0 || pages.length > 0)) {
      flush();
      // Inject repeatHeader at the top of the new page — but not if the current
      // fragment IS the header (it will be pushed normally below).
      if (pendingRepeatHeader && f !== pendingRepeatHeader && !current.includes(pendingRepeatHeader)) {
        current.push(pendingRepeatHeader);
        used += heights.get(pendingRepeatHeader.id) ?? 0;
      }
      currentBreakReason = 'manual';
    }

    // keepWithNext: قيّم العنوان مع تابعه المباشر كوحدة (إن كان التابع يتّسع وحده).
    let needed = h;
    let breakReason: BreakReason = f.keepTogether ? 'keepTogether' : 'overflow';
    if (f.keepWithNext && i + 1 < fragments.length) {
      const next = fragments[i + 1];
      const nextH = heights.get(next.id) ?? 0;
      if (nextH <= availablePx) {
        needed = h + nextH;
        breakReason = 'keepWithNext';
      }
    }

    if (used > 0 && used + needed > availablePx) {
      flush();
      // Inject repeatHeader at the top of the new page — but not if the current
      // fragment IS the header (it will be pushed normally below).
      if (pendingRepeatHeader && f !== pendingRepeatHeader && !current.includes(pendingRepeatHeader)) {
        current.push(pendingRepeatHeader);
        used += heights.get(pendingRepeatHeader.id) ?? 0;
      }
      currentBreakReason = breakReason;
    }

    current.push(f);
    used += h;
  }

  flush();

  return { pages, warnings };
};
