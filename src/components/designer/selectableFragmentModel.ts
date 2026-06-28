// ── Phase 47A: Unified Selectable Fragment Model ──
// Maps every selectable report fragment to its capabilities.
// Internal model only — no UI dependency.

import type { SelectableFragment, SelectableFragmentKind } from './types';

// ── Capability table per kind ──

type FragmentCapabilities = {
  labelArabic: string;
  canStyle: boolean;
  canReorder: boolean;
  canPageBreakBefore: boolean;
  canHide: boolean;
  canDelete: boolean;
};

const CAPABILITIES: Record<SelectableFragmentKind, FragmentCapabilities> = {
  mainTitle: {
    labelArabic: 'عنوان التقرير',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  introParagraph: {
    labelArabic: 'فقرة تمهيدية',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  introHeading: {
    labelArabic: 'عنوان تمهيدي',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  committee: {
    labelArabic: 'لجنة التفتيش',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  summaryTableTitle: {
    labelArabic: 'عنوان جدول ملخص',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  sectionTitle: {
    labelArabic: 'عنوان قسم',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  sectionNarrative: {
    labelArabic: 'سرد القسم',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  subsectionTitle: {
    labelArabic: 'عنوان قسم فرعي',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  subsectionNarrative: {
    labelArabic: 'سرد القسم الفرعي',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  findingItem: {
    labelArabic: 'مكتشف / تفصيل',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  listItem: {
    labelArabic: 'عنصر قائمة',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  officialNotesTitle: {
    labelArabic: 'عنوان الملاحظات',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  notesCategoryTitle: {
    labelArabic: 'تصنيف ملاحظات',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  noteItem: {
    labelArabic: 'ملاحظة',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  recommendationsTitle: {
    labelArabic: 'عنوان التوصيات',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  recommendationAuthorityTitle: {
    labelArabic: 'جهة توصية',
    canStyle: true,
    canReorder: true,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  recommendationItem: {
    labelArabic: 'توصية',
    canStyle: true,
    canReorder: true,
    canPageBreakBefore: false, // Page breaks only at recommendations section level (end-to-end support)
    canHide: false,
    canDelete: false,
  },
  appendicesTitle: {
    labelArabic: 'عنوان الملاحق',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  appendixItem: {
    labelArabic: 'ملحق',
    canStyle: true,
    canReorder: true,
    canPageBreakBefore: true,
    canHide: true,
    canDelete: true,
  },
  finalEvaluation: {
    labelArabic: 'التقييم النهائي',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
  signatures: {
    labelArabic: 'التوقيعات',
    canStyle: true,
    canReorder: false,
    canPageBreakBefore: true,
    canHide: false,
    canDelete: false,
  },
};

// ── Fragment ID pattern → kind resolver ──

const FRAGMENT_PATTERNS: [RegExp, (match: RegExpMatchArray) => SelectableFragmentKind][] = [
  [/^frag-report-title(?:$|:)/, () => 'mainTitle'],
  [/^frag-assignment(?:$|:)/, () => 'introParagraph'],
  [/^frag-purpose(?:$|:)/, () => 'introParagraph'],
  [/^frag-visit-date(?:$|:)/, () => 'introParagraph'],
  [/^frag-committee(?:$|:)/, () => 'committee'],
  [/^frag-summary-tables/, () => 'summaryTableTitle'],

  [/^section\/[^/]+\/narrative$/, () => 'sectionNarrative'],
  [/^section\/[^/]+\/manual\//, () => 'listItem'],
  [/^section\/[^/]+\/list\//, () => 'listItem'],
  [/^section\/[^/]+$/, () => 'sectionTitle'],

  [/^subsection\/[^/]+\/narrative$/, () => 'subsectionNarrative'],
  [/^subsection\/[^/]+\/finding\//, () => 'findingItem'],
  [/^subsection\/[^/]+\/officer\//, () => 'findingItem'],
  [/^subsection\/[^/]+\/detail\//, () => 'findingItem'],
  [/^subsection\/[^/]+\/details$/, () => 'findingItem'],
  [/^subsection\/[^/]+\/tables$/, () => 'findingItem'],
  [/^subsection\/[^/]+\/list\//, () => 'listItem'],
  [/^subsection\/[^/]+$/, () => 'subsectionTitle'],

  [/^frag-official-notes-title/, () => 'officialNotesTitle'],
  [/^frag-official-notes-.+-title$/, () => 'notesCategoryTitle'],
  [/^frag-official-notes-.+-empty$/, () => 'noteItem'],
  [/^list-item\/official_notes\//, () => 'noteItem'],

  [/^frag-recommendations-title/, () => 'recommendationsTitle'],
  [/^recommendation-group\/[^/]+\/empty$/, () => 'recommendationItem'],
  [/^recommendation-group\//, () => 'recommendationAuthorityTitle'],
  [/^frag-recommendations-empty$/, () => 'recommendationItem'],
  [/^recommendation\//, () => 'recommendationItem'],

  [/^frag-appendices-title/, () => 'appendicesTitle'],
  [/^appendix\/[^/]+\/paragraph\//, () => 'appendixItem'],
  [/^appendix\//, () => 'appendixItem'],

  [/^frag-final-evaluation/, () => 'finalEvaluation'],
  [/^frag-signatures/, () => 'signatures'],
];

/**
 * Resolve a fragment ID to its SelectableFragment model.
 * Returns null for unrecognised or non-selectable fragment IDs.
 */
export function resolveSelectableFragment(fragmentId: string): SelectableFragment | null {
  if (!fragmentId) return null;

  for (const [pattern, toKind] of FRAGMENT_PATTERNS) {
    const match = fragmentId.match(pattern);
    if (match) {
      const kind = toKind(match);
      const caps = CAPABILITIES[kind];
      return {
        fragmentId,
        labelArabic: caps.labelArabic,
        kind,
        canStyle: caps.canStyle,
        canReorder: caps.canReorder,
        canPageBreakBefore: caps.canPageBreakBefore,
        canHide: caps.canHide,
        canDelete: caps.canDelete,
      };
    }
  }

  return null;
}

// ── Dev diagnostics ──

export function auditSelectableFragmentModel(fragments: { id: string }[]): void {
  if (!import.meta.env.DEV) return;
  const unresolved: string[] = [];
  const resolved = new Map<string, SelectableFragmentKind>();

  for (const frag of fragments) {
    const model = resolveSelectableFragment(frag.id);
    if (model) {
      resolved.set(frag.id, model.kind);
    } else {
      unresolved.push(frag.id);
    }
  }

  const byKind = new Map<SelectableFragmentKind, number>();
  for (const kind of resolved.values()) {
    byKind.set(kind, (byKind.get(kind) || 0) + 1);
  }

  console.group('[Phase 47A] Selectable Fragment Model Audit');
  console.log(`Total fragments: ${fragments.length}`);
  console.log(`Resolved: ${resolved.size}`);
  console.log(`Unresolved: ${unresolved.length}`);
  if (unresolved.length > 0) {
    console.warn('Unresolved fragment IDs:', unresolved);
  }
  console.log('By kind:');
  for (const [kind, count] of byKind.entries()) {
    console.log(`  ${kind}: ${count}`);
  }
  console.groupEnd();
}
