import { A4 } from '../../utils/paginate';

export const DESIGNER_FOOTER_HEIGHT_MM = 18;
export const DESIGNER_BOTTOM_GUTTER_MM = Math.max(
  0,
  A4.margin.bottom - DESIGNER_FOOTER_HEIGHT_MM,
);
