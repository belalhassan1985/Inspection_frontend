import type { Fragment } from './reportFragments';
import type { PageModel } from './paginate';
import { A4 } from './paginate';

export type PageDocumentModel = {
  source: 'designer';
  pages: PageModel[];
  fragments: Fragment[];
  heights: Record<string, number>;
  generatedAt: string;
  layout: {
    pageSize: 'A4';
    widthMm: number;
    heightMm: number;
    marginsMm: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
};

export const buildPageDocumentModel = (
  fragments: Fragment[],
  heights: Map<string, number>,
  pages: PageModel[]
): PageDocumentModel => ({
  source: 'designer',
  pages,
  fragments,
  heights: Object.fromEntries(heights),
  generatedAt: new Date().toISOString(),
  layout: {
    pageSize: 'A4',
    widthMm: A4.widthMm,
    heightMm: A4.heightMm,
    marginsMm: {
      top: A4.margin.top,
      right: A4.margin.right,
      bottom: A4.margin.bottom,
      left: A4.margin.left,
    },
  },
});
