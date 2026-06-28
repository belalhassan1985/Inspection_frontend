import React, { useEffect, useRef } from 'react';
import type { Fragment } from '../../utils/reportFragments';
import { A4 } from '../../utils/paginate';
import { FragmentRenderer } from './FragmentRenderer';
import { buildPreviewStyleCss } from './designerStyleOverrides';
import { useDesignerMainStyleSync } from './useDesignerMainStyleSync';
import { DESIGNER_BOTTOM_GUTTER_MM, DESIGNER_FOOTER_HEIGHT_MM } from './designerPageLayout';
import type { DesignerStyleState, ElementStyleOverride } from './types';

export type BlockMeasurementResult = {
  heights: Map<string, number>;
  availableContentHeightPx: number;
};

export const BlockMeasurer: React.FC<{
  fragments: Fragment[];
  styleState: DesignerStyleState;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  elementTextOverrides: Record<string, string>;
  manualPageBreaks: string[];
  reportPayload: unknown;
  onMeasured: (result: BlockMeasurementResult) => void;
}> = ({
  fragments,
  styleState,
  elementStyleOverrides,
  elementTextOverrides,
  manualPageBreaks,
  reportPayload,
  onMeasured,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const originalTextRef = useRef<Record<string, string>>({});
  const selectedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    originalTextRef.current = {};
  }, [fragments, reportPayload]);

  useDesignerMainStyleSync({
    previewScopeRef: containerRef,
    originalTextRef,
    selectedElementRef,
    elementTextOverrides,
    elementStyleOverrides,
    styleState,
    designerMode: 'preview',
    selectedElementId: null,
    reportPayload,
    renderedPagesCount: 1,
  });

  useEffect(() => {
    let cancelled = false;

    const measure = async () => {
      const root = containerRef.current;
      const content = contentRef.current;
      if (!root || !content) return;

      if (typeof document !== 'undefined' && document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Continue with the browser fallback font if font loading fails.
        }
      }

      const images = Array.from(root.querySelectorAll('img'));
      await Promise.all(images.map((image) => (
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          })
      )));

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (cancelled) return;

      const nodes = Array.from(root.querySelectorAll<HTMLElement>('.rd-a4-content > [data-frag-id]'));
      const heights = new Map<string, number>();

      const measureFragmentVisualHeight = (node: HTMLElement): number => {
        const rect = node.getBoundingClientRect();
        let top = rect.top;
        let bottom = rect.bottom;

        for (const child of Array.from(node.children)) {
          const childEl = child as HTMLElement;
          const childRect = childEl.getBoundingClientRect();
          const childStyle = window.getComputedStyle(childEl);

          const childTop = childRect.top - (parseFloat(childStyle.marginTop) || 0);
          const childBottom = childRect.bottom + (parseFloat(childStyle.marginBottom) || 0);

          top = Math.min(top, childTop);
          bottom = Math.max(bottom, childBottom);
        }

        return Math.max(0, bottom - top);
      };

      nodes.forEach((node) => {
        const id = node.dataset.fragId;
        if (!id) return;

        const height = measureFragmentVisualHeight(node);
        heights.set(id, height);
      });

      onMeasured({
        heights,
        availableContentHeightPx: content.clientHeight,
      });
    };

    measure();
    return () => {
      cancelled = true;
    };
  }, [
    elementStyleOverrides,
    elementTextOverrides,
    fragments,
    manualPageBreaks,
    onMeasured,
    reportPayload,
    styleState,
  ]);

  return (
    <div
      ref={containerRef}
      className="rd-style-scope"
      aria-hidden="true"
      style={{
        position: 'absolute',
        visibility: 'hidden',
        pointerEvents: 'none',
        right: '-99999px',
        top: 0,
        direction: 'rtl',
        textAlign: 'right',
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: buildPreviewStyleCss(styleState) }} />
      <div
        className="rd-a4-page"
        style={{
          width: `${A4.widthMm}mm`,
          height: `${A4.heightMm}mm`,
          minHeight: `${A4.heightMm}mm`,
          maxHeight: `${A4.heightMm}mm`,
          padding: `${A4.margin.top}mm ${A4.margin.right}mm ${DESIGNER_BOTTOM_GUTTER_MM}mm ${A4.margin.left}mm`,
          margin: 0,
          border: '1px solid #94a3b8',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          ref={contentRef}
          className="rd-a4-content"
          style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden', width: '100%' }}
        >
          {fragments.map((fragment) => (
            <div
              key={fragment.id}
              data-frag-id={fragment.id}
              data-frag-kind={fragment.kind}
              className={`rd-fragment rd-fragment-${fragment.kind}`}
              style={{ position: 'relative' }}
            >
              <FragmentRenderer fragment={fragment} />
            </div>
          ))}
          <div data-measure-sentinel style={{ height: '1px', visibility: 'hidden', pointerEvents: 'none' }} />
        </div>
        <div
          className="rd-a4-footer"
          style={{
            position: 'relative',
            flex: `0 0 ${DESIGNER_FOOTER_HEIGHT_MM}mm`,
            height: `${DESIGNER_FOOTER_HEIGHT_MM}mm`,
            minHeight: `${DESIGNER_FOOTER_HEIGHT_MM}mm`,
          }}
        />
      </div>
    </div>
  );
};
