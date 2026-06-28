import type { SelectedElementType } from './types';

export const getElementId = (type: Exclude<SelectedElementType, null>, element: HTMLElement): string => {
  const page = element.closest('.rd-a4-page') as HTMLElement | null;
  const pageIndex = page?.dataset.pageIndex || '0';
  if (type === 'page') return `page:${pageIndex}`;

  const fragment = element.closest('.rd-fragment') as HTMLElement | null;
  const fragmentId = fragment?.dataset.fragId || `page-${pageIndex}-frag-${fragment?.dataset.fragIndex || '0'}`;
  const indexInFragment = (selector: string) => {
    if (!fragment) return 0;
    return Array.from(fragment.querySelectorAll(selector)).indexOf(element);
  };

  if (type === 'tableCell') {
    const cell = element as HTMLTableCellElement;
    const table = cell.closest('table, .military-table') as HTMLElement | null;
    const tableIndex = fragment && table ? Array.from(fragment.querySelectorAll('table, .military-table')).indexOf(table) : 0;
    const row = cell.parentElement as HTMLTableRowElement | null;
    return `${fragmentId}:table-cell:${tableIndex}:${row?.rowIndex ?? 0}:${cell.cellIndex}`;
  }

  if (type === 'table') return `${fragmentId}:table:${indexInFragment('table, .military-table')}`;
  if (type === 'mainTitle') return `${fragmentId}:main-title`;
  if (type === 'numbering') return `${fragmentId}:numbering:${indexInFragment('.rd-numbering, .section-num')}`;
  if (type === 'subheading') return `${fragmentId}:subheading:${indexInFragment('.rd-subheading-title, .section-num')}`;
  return `${fragmentId}:paragraph:${indexInFragment('.rd-paragraph-text, .section-body, .rd-fragment-narrative, .rd-fragment-inspectionDetailItem')}`;
};

export const getElementText = (element: HTMLElement) => element.textContent || '';
