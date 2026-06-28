/**
 * Phase 18C — Official Export Override Bridge
 *
 * Transforms Designer text overrides into a modified payload for the
 * official PDF generator (POST /reports/campaign/:id/pdf).
 *
 * Architecture:
 *   Designer elementTextOverrides (fragment-ID-keyed strings)
 *     → resolveFragmentIdToPayloadPath() maps fragment ID → payload path
 *     → deep-cloned payload mutated at resolved paths
 *     → pdfReview stripped
 *     → returned as clean export payload
 *
 * Safety:
 *   - Deep clones the original payload (never mutates input).
 *   - Unknown/missing paths are silently skipped.
 *   - pdfReview is always deleted from the export copy.
 *   - No style overrides or manual breaks in this phase.
 *
 * V2: elementStyleOverrides, manualPageBreaks, committee/text/json overrides.
 */

import { normalizeFlowTargetIds, resolveOfficialExportBreakId } from './designerFlowTargets';
import { simpleContentHash } from './reportFragments';

// ── Types ──

export type DesignerSpacerEntry = {
  id: string;
  afterFragmentIndex: number;
  heightMm: number;
  afterSectionIndex: number;
};

export type DesignerOverrideState = {
  elementTextOverrides?: Record<string, string>;
  elementStyleOverrides?: Record<string, Record<string, unknown>>;
  formattingConfig?: {
    fontFamily?: string;
    baseFontSize?: number;
    titleColor?: string;
    titleFontSize?: number;
    titleFontWeight?: number | string;
    titleAlign?: string;
    numberingColor?: string;
    tableBorderColor?: string;
    tableHeaderBg?: string;
    tableCellPadding?: string;
    density?: string;
  };
  manualPageBreaks?: string[];
  designerSpacers?: DesignerSpacerEntry[];
};

// ── Public API ──

/**
 * Apply designer text overrides to a deep-cloned copy of the official payload.
 *
 * @param payload       — Original official report payload (read-only).
 * @param designerState — Designer override state (only elementTextOverrides used in Phase 18C).
 * @returns             — Deep clone with overrides applied, pdfReview removed.
 */
export function applyDesignerOverridesToOfficialPayload(
  payload: any,
  designerState: DesignerOverrideState,
): any {
  const result = deepClone(payload);

  // Phase 18C: Apply text overrides
  // Phase 24D: Official Notes & Recommendations are stored as JSON blobs under
  // dedicated content IDs. Intercept them before the per-key loop so the blob
  // can be decomposed into individual payload paths.
  // Phase 24E: Signatures blob added (leader + deputy rank/name/role).
  // Phase 24G: Committee & Appendices blob handlers added.
  const textOverrides = designerState.elementTextOverrides;
  if (textOverrides && typeof textOverrides === 'object') {
    for (const [elementId, overrideValue] of Object.entries(textOverrides)) {
      if (elementId === OFFICIAL_NOTES_CONTENT_ID) {
        applyOfficialNotesBlobOverride(result, overrideValue);
        continue;
      }
      if (elementId === RECOMMENDATIONS_CONTENT_ID) {
        applyRecommendationsBlobOverride(result, overrideValue);
        continue;
      }
      if (elementId === SIGNATURES_CONTENT_ID) {
        applySignaturesBlobOverride(result, overrideValue);
        continue;
      }
      if (elementId === COMMITTEE_CONTENT_ID) {
        applyCommitteeBlobOverride(result, overrideValue);
        continue;
      }
      if (elementId === APPENDICES_CONTENT_ID) {
        applyAppendicesBlobOverride(result, overrideValue);
        continue;
      }
      applySingleTextOverride(result, elementId, overrideValue);
    }
  }

  // Phase 18G: Apply formatting config (Designer styles → official PDF)
  const fmt = designerState.formattingConfig;
  if (fmt && typeof fmt === 'object') {
    const formatting: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fmt)) {
      if (value !== undefined && value !== null && value !== '') {
        formatting[key] = value;
      }
    }
    if (Object.keys(formatting).length > 0) {
      result.formatting = { ...(result.formatting || {}), ...formatting };
    }
  }

  // Phase 18M: Bridge per-element title style overrides into official formatting only.
  const titleFormatting = mapTitleStyleOverrideToFormatting(designerState.elementStyleOverrides);
  if (Object.keys(titleFormatting).length > 0) {
    result.formatting = { ...(result.formatting || {}), ...titleFormatting };
  }

  // Phase 18N-1: Bridge per-element assignment paragraph style overrides into official formatting.
  const assignmentFormatting = mapAssignmentParagraphStyleOverrideToFormatting(designerState.elementStyleOverrides);
  if (Object.keys(assignmentFormatting).length > 0) {
    result.formatting = { ...(result.formatting || {}), ...assignmentFormatting };
  }

  // Phase 18P: Bridge per-element intro heading/numbering style overrides into official formatting.
  const introHeadingConfigs: { elementId: string; prefix: string }[] = [
    { elementId: 'frag-assignment:numbering:0', prefix: 'assignmentHeading' },
    { elementId: 'frag-committee:numbering:0',  prefix: 'committeeHeading' },
    { elementId: 'frag-purpose:numbering:0',    prefix: 'purposeHeading' },
    { elementId: 'frag-visit-date:numbering:0', prefix: 'visitDateHeading' },
  ];
  for (const cfg of introHeadingConfigs) {
    const hFmt = mapIntroHeadingStyleOverrideToFormatting(designerState.elementStyleOverrides, cfg.elementId, cfg.prefix);
    if (Object.keys(hFmt).length > 0) {
      result.formatting = { ...(result.formatting || {}), ...hFmt };
    }
  }

  // Phase 37: Export the same fragment-based flowTargetIds used by the canvas.
  const flowTargetIds = normalizeFlowTargetIds(designerState.manualPageBreaks);
  const breaks = [...new Set(flowTargetIds
    .map(resolveOfficialExportBreakId)
    .filter((id): id is string => id !== null))];
  if (breaks.length > 0) {
    const deduped = breaks;
    if (deduped.length > 0) {
      result.manualBreaks = deduped;
    }
  }

  // Phase 20A-1: Pass designer spacers to the official payload
  const spacers = designerState.designerSpacers;
  if (Array.isArray(spacers) && spacers.length > 0) {
    result.spacers = spacers.map((s) => ({
      id: s.id,
      afterFragmentIndex: s.afterFragmentIndex,
      heightMm: s.heightMm,
      afterSectionIndex: s.afterSectionIndex,
    }));
  }

  // pdfReview must never enter the official PDF pipeline
  delete result.pdfReview;

  return result;
}

// ── Internal ──

function mapTitleStyleOverrideToFormatting(
  elementStyleOverrides: DesignerOverrideState['elementStyleOverrides'],
): Record<string, unknown> {
  if (!elementStyleOverrides || typeof elementStyleOverrides !== 'object') return {};

  const titleOverride =
    elementStyleOverrides['frag-report-title:main-title'] ||
    elementStyleOverrides['frag-report-title'] ||
    elementStyleOverrides['main-title'] ||
    elementStyleOverrides['title-main'];

  if (!titleOverride || typeof titleOverride !== 'object') return {};

  const formatting: Record<string, unknown> = {};
  const color = titleOverride.mainTitleColor ?? titleOverride.color ?? titleOverride.titleColor;
  const fontSize = titleOverride.mainTitleFontSize ?? titleOverride.fontSize;
  const fontWeight = titleOverride.mainTitleWeight ?? titleOverride.fontWeight ?? titleOverride.mainTitleFontWeight;
  const textAlign = titleOverride.titleTextAlign ?? titleOverride.textAlign ?? titleOverride.titleAlign;

  if (color !== undefined && color !== null && color !== '') {
    formatting.titleColor = color;
  }
  if (fontSize !== undefined && fontSize !== null && fontSize !== '') {
    formatting.titleFontSize = fontSize;
  }
  if (fontWeight !== undefined && fontWeight !== null && fontWeight !== '') {
    formatting.titleFontWeight = fontWeight;
  }
  if (textAlign !== undefined && textAlign !== null && textAlign !== '') {
    formatting.titleAlign = textAlign;
  }

  return formatting;
}

const ASSIGNMENT_PARAGRAPH_ELEMENT_ID = 'frag-assignment:paragraph:0';

function mapAssignmentParagraphStyleOverrideToFormatting(
  elementStyleOverrides: DesignerOverrideState['elementStyleOverrides'],
): Record<string, unknown> {
  if (!elementStyleOverrides || typeof elementStyleOverrides !== 'object') return {};

  const assignmentOverride = elementStyleOverrides[ASSIGNMENT_PARAGRAPH_ELEMENT_ID];
  if (!assignmentOverride || typeof assignmentOverride !== 'object') return {};

  const formatting: Record<string, unknown> = {};
  const color = assignmentOverride.paragraphColor;
  const fontSize = assignmentOverride.paragraphFontSize;
  const fontWeight = assignmentOverride.paragraphFontWeight;
  const lineHeight = assignmentOverride.paragraphLineHeight;

  if (color !== undefined && color !== null && color !== '') {
    formatting.assignmentParagraphColor = color;
  }
  if (fontSize !== undefined && fontSize !== null && fontSize !== '') {
    formatting.assignmentParagraphFontSize = fontSize;
  }
  if (fontWeight !== undefined && fontWeight !== null && fontWeight !== '') {
    formatting.assignmentParagraphFontWeight = fontWeight;
  }
  if (lineHeight !== undefined && lineHeight !== null && lineHeight !== '') {
    formatting.assignmentParagraphLineHeight = lineHeight;
  }

  return formatting;
}

function mapIntroHeadingStyleOverrideToFormatting(
  elementStyleOverrides: DesignerOverrideState['elementStyleOverrides'],
  elementId: string,
  outputPrefix: string,
): Record<string, unknown> {
  if (!elementStyleOverrides || typeof elementStyleOverrides !== 'object') return {};

  const headingOverride = elementStyleOverrides[elementId];
  if (!headingOverride || typeof headingOverride !== 'object') return {};

  const formatting: Record<string, unknown> = {};
  const color = headingOverride.numberingColor;
  const fontSize = headingOverride.numberingFontSize;
  const fontWeight = headingOverride.numberingWeight;

  if (color !== undefined && color !== null && color !== '') {
    formatting[`${outputPrefix}Color`] = color;
  }
  if (fontSize !== undefined && fontSize !== null && fontSize !== '') {
    formatting[`${outputPrefix}FontSize`] = fontSize;
  }
  if (fontWeight !== undefined && fontWeight !== null && fontWeight !== '') {
    formatting[`${outputPrefix}FontWeight`] = fontWeight;
  }

  return formatting;
}

function applySingleTextOverride(
  result: any,
  elementId: string,
  overrideValue: unknown,
): void {
  // Validate value
  if (typeof overrideValue !== 'string') return;
  if (overrideValue.length > 10_000) return;

  // Extract fragment ID (strip element-type suffix like :paragraph:0)
  const fragmentId = extractFragmentId(elementId);
  if (!fragmentId) return;

  // Resolve fragment ID → payload path (returns null when unknown/missing)
  const segments = resolveFragmentIdToPayloadPath(fragmentId, result);
  if (!segments) return;

  // Apply
  setValueAtPath(result, segments, overrideValue);
}

// ── Phase 24D: JSON blob content IDs ──
// These constants mirror the values in components/designer/types.ts
// (OFFICIAL_NOTES_CONTENT_ID / RECOMMENDATIONS_CONTENT_ID / SIGNATURES_CONTENT_ID /
//  COMMITTEE_CONTENT_ID / APPENDICES_CONTENT_ID).
// The inspectors store the entire block as a JSON blob under a single key
// so that canvas sync and draft persistence work without per-item keys.
// The bridge decomposes the blob back into individual payload paths.
const OFFICIAL_NOTES_CONTENT_ID = 'frag-official-notes:notes-content';
const RECOMMENDATIONS_CONTENT_ID = 'frag-recommendations:recommendations-content';
const SIGNATURES_CONTENT_ID = 'frag-signatures:signatures-content';
const COMMITTEE_CONTENT_ID = 'frag-committee:committee-members';
const APPENDICES_CONTENT_ID = 'frag-appendices:appendices-content';

// Official notes list-type (plural, matching reportFragments LIST_TYPES) → payload list key
const NOTES_LIST_TYPE_TO_KEY: Record<string, string> = {
  positives: 'positivesList',
  negatives: 'negativesList',
  impediments: 'impedimentsList',
  obstacles: 'obstaclesList',
};

/**
 * Phase 24D — Apply an Official Notes JSON blob override to the export payload.
 *
 * The blob is produced by the Official Notes Inspector in PropertiesPanel and
 * has the shape: { positives: string[], negatives: string[], impediments: string[], obstacles: string[] }
 *
 * Each list is written into sections[manualIdx][listKey][k] in-place, only
 * replacing items that already exist in the payload (index-bounded).
 *
 * Safety: silently skips when the manual section is missing, the blob is
 * malformed, or a list/array is absent — no crash on empty notes.
 */
function applyOfficialNotesBlobOverride(result: any, overrideValue: unknown): void {
  if (typeof overrideValue !== 'string' || overrideValue.length === 0) return;
  let parsed: any;
  try {
    parsed = JSON.parse(overrideValue);
  } catch {
    return;
  }
  if (typeof parsed !== 'object' || parsed === null) return;

  const sections: any[] = Array.isArray(result?.sections) ? result.sections : [];
  const manualIdx = sections.findIndex((s: any) => s?.isManual === true || s?.id === 'manual-notes');
  if (manualIdx === -1) return;

  const manualSection = sections[manualIdx];
  for (const [listType, listKey] of Object.entries(NOTES_LIST_TYPE_TO_KEY)) {
    const overrideList = parsed[listType];
    if (!Array.isArray(overrideList)) continue;
    const existingList = manualSection[listKey];
    if (!Array.isArray(existingList)) continue;
    for (let idx = 0; idx < overrideList.length; idx++) {
      if (idx >= existingList.length) break;
      const text = overrideList[idx];
      if (typeof text === 'string') {
        existingList[idx] = text;
      }
    }
  }
}

/**
 * Phase 24D — Apply a Recommendations JSON blob override to the export payload.
 *
 * The blob is produced by the Recommendations Inspector in PropertiesPanel and
 * has the shape: [{ id?, authority: string, recs: [{ id?, text: string, children: [{ id?, text: string }] }] }]
 *
 * Each override group is matched to its original group by id first, then by
 * authority, and moved as a complete group. Recommendation order inside the
 * group is preserved from the override blob.
 *
 * Safety: silently skips when recommendations are missing, the blob is
 * malformed, or an index is out of range — no crash on empty recommendations.
 */
function applyRecommendationsBlobOverride(result: any, overrideValue: unknown): void {
  if (typeof overrideValue !== 'string' || overrideValue.length === 0) return;
  let parsed: any;
  try {
    parsed = JSON.parse(overrideValue);
  } catch {
    return;
  }
  if (!Array.isArray(parsed)) return;

  const recommendations: any[] = Array.isArray(result?.recommendations) ? result.recommendations : [];
  if (recommendations.length === 0) return;

  const usedGroupIndexes = new Set<number>();
  const reorderedGroups: any[] = [];

  for (let g = 0; g < parsed.length; g++) {
    const overrideGroup = parsed[g];
    if (!overrideGroup || typeof overrideGroup !== 'object') continue;

    const targetIndex = findRecommendationGroupIndex(recommendations, overrideGroup, g, usedGroupIndexes);
    if (targetIndex < 0) continue;

    const targetGroup = recommendations[targetIndex];
    applyRecommendationGroupOverride(targetGroup, overrideGroup);
    usedGroupIndexes.add(targetIndex);
    reorderedGroups.push(targetGroup);
  }

  recommendations.forEach((group, index) => {
    if (!usedGroupIndexes.has(index)) reorderedGroups.push(group);
  });

  result.recommendations = reorderedGroups;
}

function findRecommendationGroupIndex(
  recommendations: any[],
  overrideGroup: any,
  fallbackIndex: number,
  usedIndexes: Set<number>,
): number {
  const overrideId = overrideGroup?.id;
  if (overrideId !== undefined && overrideId !== null) {
    const byId = recommendations.findIndex((group, index) => (
      !usedIndexes.has(index)
      && group?.id !== undefined
      && group?.id !== null
      && String(group.id) === String(overrideId)
    ));
    if (byId >= 0) return byId;
  }

  if (typeof overrideGroup?.authority === 'string' && overrideGroup.authority.trim() !== '') {
    const byAuthority = recommendations.findIndex((group, index) => (
      !usedIndexes.has(index)
      && String(group?.authority ?? '').trim() === overrideGroup.authority.trim()
    ));
    if (byAuthority >= 0) return byAuthority;
  }

  if (fallbackIndex >= 0 && fallbackIndex < recommendations.length && !usedIndexes.has(fallbackIndex)) {
    return fallbackIndex;
  }

  return -1;
}

function applyRecommendationGroupOverride(targetGroup: any, overrideGroup: any): void {
  if (!targetGroup || typeof targetGroup !== 'object') return;

  if (typeof overrideGroup.authority === 'string') {
    targetGroup.authority = overrideGroup.authority;
  }

  const overrideRecs = overrideGroup.recs;
  const targetRecs = targetGroup?.recs;
  if (!Array.isArray(overrideRecs) || !Array.isArray(targetRecs)) return;

  const usedRecIndexes = new Set<number>();
  const reorderedRecs: any[] = [];

  for (let r = 0; r < overrideRecs.length; r++) {
    const overrideRec = overrideRecs[r];
    if (!overrideRec || typeof overrideRec !== 'object') continue;
    const targetIndex = findRecommendationItemIndex(targetRecs, overrideRec, r, usedRecIndexes);
    if (targetIndex < 0) continue;

    const targetRec = targetRecs[targetIndex];
    applyRecommendationItemOverride(targetRec, overrideRec);
    usedRecIndexes.add(targetIndex);
    reorderedRecs.push(targetRec);
  }

  targetRecs.forEach((rec, index) => {
    if (!usedRecIndexes.has(index)) reorderedRecs.push(rec);
  });

  targetGroup.recs = reorderedRecs;
}

function findRecommendationItemIndex(
  recommendations: any[],
  overrideRec: any,
  fallbackIndex: number,
  usedIndexes: Set<number>,
): number {
  const overrideId = overrideRec?.id;
  if (overrideId !== undefined && overrideId !== null) {
    const byId = recommendations.findIndex((rec, index) => (
      !usedIndexes.has(index)
      && rec?.id !== undefined
      && rec?.id !== null
      && String(rec.id) === String(overrideId)
    ));
    if (byId >= 0) return byId;
  }

  if (fallbackIndex >= 0 && fallbackIndex < recommendations.length && !usedIndexes.has(fallbackIndex)) {
    return fallbackIndex;
  }

  return -1;
}

function applyRecommendationItemOverride(targetRec: any, overrideRec: any): void {
  if (!targetRec || typeof targetRec !== 'object') return;

  if (typeof overrideRec.text === 'string') {
    if (overrideRec.text !== targetRec.text) {
      targetRec.text = overrideRec.text;
      targetRec.designerOverride = true;
    } else {
      delete targetRec.designerOverride;
    }
  }

  if (!Array.isArray(overrideRec.children) || !Array.isArray(targetRec.children)) return;

  for (let c = 0; c < overrideRec.children.length; c++) {
    const overrideChild = overrideRec.children[c];
    if (!overrideChild || typeof overrideChild !== 'object') continue;
    if (c >= targetRec.children.length) break;
    if (typeof overrideChild.text === 'string') {
      if (overrideChild.text !== targetRec.children[c].text) {
        targetRec.children[c].text = overrideChild.text;
        targetRec.children[c].designerOverride = true;
      } else {
        delete targetRec.children[c].designerOverride;
      }
    }
  }
}

/**
 * Phase 24E — Apply a Signatures JSON blob override to the export payload.
 *
 * The blob is produced by the Signatures Inspector in PropertiesPanel and
 * has the shape: [{ rank: string, name: string, role: string }, { rank: string, name: string, role: string }]
 *
 * Index 0 maps to the leader fields (leaderRank/leaderName/leaderRole) and
 * index 1 maps to the deputy fields (deputyRank/deputyName/deputyRole) in
 * payload.signatures. These are the only two signer slots supported by the
 * inspector and the backend payload model.
 *
 * Safety: silently skips when signatures object is missing, the blob is
 * malformed, or a signer index is out of range — no crash on empty/missing
 * signatures. Does NOT add/remove signers or change ordering.
 */
function applySignaturesBlobOverride(result: any, overrideValue: unknown): void {
  if (typeof overrideValue !== 'string' || overrideValue.length === 0) return;
  let parsed: any;
  try {
    parsed = JSON.parse(overrideValue);
  } catch {
    return;
  }
  if (!Array.isArray(parsed)) return;

  const sig = result?.signatures;
  if (!sig || typeof sig !== 'object') return;

  // Index 0 → leader fields
  if (parsed.length > 0 && parsed[0] && typeof parsed[0] === 'object') {
    const leader = parsed[0];
    if (typeof leader.rank === 'string') sig.leaderRank = leader.rank;
    if (typeof leader.name === 'string') sig.leaderName = leader.name;
    if (typeof leader.role === 'string') sig.leaderRole = leader.role;
  }

  // Index 1 → deputy fields
  if (parsed.length > 1 && parsed[1] && typeof parsed[1] === 'object') {
    const deputy = parsed[1];
    if (typeof deputy.rank === 'string') sig.deputyRank = deputy.rank;
    if (typeof deputy.name === 'string') sig.deputyName = deputy.name;
    if (typeof deputy.role === 'string') sig.deputyRole = deputy.role;
  }
}

/**
 * Phase 24G — Apply a Committee JSON blob override to the export payload.
 *
 * The blob is produced by the Committee Inspector in PropertiesPanel and
 * has the shape: [{ rank: string, name: string, role: string }, ...]
 *
 * The payload stores committee members as a string array where each string
 * follows the format "rank name  role" (name and role separated by 2+ spaces).
 * The backend parser (parseCommitteeMember) splits on /\s{2,}/ to extract
 * name (which includes rank prefix) and role.
 *
 * This handler serializes each CommitteeMemberDraft back to that string
 * format and writes it into payload.committeeMembers[k] in-place, only
 * replacing entries that already exist (index-bounded).
 *
 * Safety: silently skips when committeeMembers is missing, the blob is
 * malformed, or an index is out of range — no crash on empty/missing
 * committee. Does NOT add/remove members or change ordering.
 */
function applyCommitteeBlobOverride(result: any, overrideValue: unknown): void {
  if (typeof overrideValue !== 'string' || overrideValue.length === 0) return;
  let parsed: any;
  try {
    parsed = JSON.parse(overrideValue);
  } catch {
    return;
  }
  if (!Array.isArray(parsed)) return;

  const members: any[] = Array.isArray(result?.committeeMembers) ? result.committeeMembers : [];

  for (let i = 0; i < parsed.length; i++) {
    if (i >= members.length) break;
    const draft = parsed[i];
    if (!draft || typeof draft !== 'object') continue;

    const rank = typeof draft.rank === 'string' ? draft.rank.trim() : '';
    const name = typeof draft.name === 'string' ? draft.name.trim() : '';
    const role = typeof draft.role === 'string' ? draft.role.trim() : '';

    // Reconstruct the payload string format: "rank name  role"
    // The name field includes the rank prefix (matching backend parser behavior).
    // Name and role are separated by 2+ spaces so the backend parser can split them.
    const namePart = rank ? `${rank} ${name}` : name;
    let memberString: string;
    if (namePart && role) {
      memberString = `${namePart}  ${role}`;
    } else if (namePart) {
      memberString = namePart;
    } else if (role) {
      memberString = role;
    } else {
      memberString = '';
    }

    if (memberString) {
      members[i] = memberString;
    }
  }
}

/**
 * Phase 24G — Apply an Appendices JSON blob override to the export payload.
 *
 * The blob is produced by the Appendices Inspector in PropertiesPanel and
 * has the shape: [{ id?, symbol: string, text: string }, ...]
 *
 * Each appendix's symbol is written to appendices[i].symbol and text to
 * appendices[i].text in-place, only replacing entries that already exist
 * (index-bounded). Multiline text is preserved as-is.
 *
 * Safety: silently skips when appendices array is missing, the blob is
 * malformed, or an index is out of range — no crash on empty/missing
 * appendices. Does NOT add/remove appendices or change ordering.
 */
function applyAppendicesBlobOverride(result: any, overrideValue: unknown): void {
  if (typeof overrideValue !== 'string' || overrideValue.length === 0) return;
  let parsed: any;
  try {
    parsed = JSON.parse(overrideValue);
  } catch {
    return;
  }
  if (!Array.isArray(parsed)) return;

  const appendices: any[] = Array.isArray(result?.appendices) ? result.appendices : [];

  for (let i = 0; i < parsed.length; i++) {
    if (i >= appendices.length) break;
    const draft = parsed[i];
    if (!draft || typeof draft !== 'object') continue;

    if (typeof draft.symbol === 'string') {
      appendices[i].symbol = draft.symbol;
    }
    if (typeof draft.text === 'string') {
      appendices[i].text = draft.text;
    }
  }
}

/**
 * Extract the fragment ID from a full element ID.
 *   "sec-0:paragraph:0"      → "sec-0"
 *   "frag-report-title:main-title" → "frag-report-title"
 *   "page:0"                 → "page"  (will be rejected by resolver)
 */
function extractFragmentId(elementId: string): string | null {
  if (!elementId || typeof elementId !== 'string') return null;
  const colonIdx = elementId.indexOf(':');
  return colonIdx === -1 ? elementId : elementId.slice(0, colonIdx);
}

/**
 * Map a fragment ID to an array of payload property path segments.
 *
 * Returns null when:
 *   - The fragment ID is unknown/unrecognised.
 *   - The target path does not exist in the payload (index out of range).
 */
function resolveFragmentIdToPayloadPath(
  fragmentId: string,
  payload: any,
): (string | number)[] | null {
  if (!fragmentId) return null;

  const sections: any[] = Array.isArray(payload?.sections) ? payload.sections : [];

  // ── Top-level scalar fields ──
  if (fragmentId === 'frag-report-title') return ['title'];
  if (fragmentId === 'frag-assignment') return ['assignmentText'];
  if (fragmentId === 'frag-purpose') return ['purposeText'];
  if (fragmentId === 'frag-visit-date') return ['durationText'];

  // frag-final-evaluation → finalEvaluation.statement
  if (fragmentId === 'frag-final-evaluation') {
    if (!payload?.finalEvaluation || typeof payload.finalEvaluation !== 'object') return null;
    return ['finalEvaluation', 'statement'];
  }

  // ── Section narrative: sec-{i} ──
  const secMatch = fragmentId.match(/^sec-(\d+)$/);
  if (secMatch) {
    const i = Number(secMatch[1]);
    if (i < 0 || i >= sections.length) return null;
    if (typeof sections[i]?.narrativeText !== 'string') return null;
    return ['sections', i, 'narrativeText'];
  }

  // ── Section title: sec-{i}-title ──
  const secTitleMatch = fragmentId.match(/^sec-(\d+)-title$/);
  if (secTitleMatch) {
    const i = Number(secTitleMatch[1]);
    if (i < 0 || i >= sections.length) return null;
    if (typeof sections[i]?.title !== 'string') return null;
    return ['sections', i, 'title'];
  }

  // ── Subsection title: sec-{i}-sub-{j}-title ──
  const subTitleMatch = fragmentId.match(/^sec-(\d+)-sub-(\d+)-title$/);
  if (subTitleMatch) {
    const i = Number(subTitleMatch[1]);
    const j = Number(subTitleMatch[2]);
    if (i < 0 || i >= sections.length) return null;
    const subs = sections[i]?.subsections;
    if (!Array.isArray(subs) || j < 0 || j >= subs.length) return null;
    if (typeof subs[j]?.title !== 'string') return null;
    return ['sections', i, 'subsections', j, 'title'];
  }

  // ── Finding item: sec-{i}-sub-{j}-finding-{k} ──
  const findingMatch = fragmentId.match(/^sec-(\d+)-sub-(\d+)-finding-(\d+)$/);
  if (findingMatch) {
    const i = Number(findingMatch[1]);
    const j = Number(findingMatch[2]);
    const k = Number(findingMatch[3]);
    if (i < 0 || i >= sections.length) return null;
    const subs = sections[i]?.subsections;
    if (!Array.isArray(subs) || j < 0 || j >= subs.length) return null;
    const findings = subs[j]?.findings;
    if (!Array.isArray(findings) || k < 0 || k >= findings.length) return null;
    return ['sections', i, 'subsections', j, 'findings', k];
  }

  // ── Subsection narrative: sec-{i}-sub-{j}-narrative ──
  const subNarrativeMatch = fragmentId.match(/^sec-(\d+)-sub-(\d+)-narrative$/);
  if (subNarrativeMatch) {
    const i = Number(subNarrativeMatch[1]);
    const j = Number(subNarrativeMatch[2]);
    if (i < 0 || i >= sections.length) return null;
    const subs = sections[i]?.subsections;
    if (!Array.isArray(subs) || j < 0 || j >= subs.length) return null;
    if (typeof subs[j]?.narrativeText !== 'string') return null;
    return ['sections', i, 'subsections', j, 'narrativeText'];
  }

  // ── Section-level finding list item: sec-{i}-list-{type}-item-{k} ──
  // type is plural (positives/negatives/impediments/obstacles) matching reportFragments LIST_TYPES
  const secListMatch = fragmentId.match(
    /^sec-(\d+)-list-(positives|negatives|impediments|obstacles)-item-(\d+)$/,
  );
  if (secListMatch) {
    const i = Number(secListMatch[1]);
    const type = secListMatch[2];
    const k = Number(secListMatch[3]);
    if (i < 0 || i >= sections.length) return null;
    const listKey = pluralListKey(type);
    if (!listKey) return null;
    const list = sections[i]?.[listKey];
    if (!Array.isArray(list) || k < 0 || k >= list.length) return null;
    return ['sections', i, listKey, k];
  }

  // ── Subsection-level finding list item: sec-{i}-sub-{j}-list-{type}-item-{k} ──
  const subListMatch = fragmentId.match(
    /^sec-(\d+)-sub-(\d+)-list-(positives|negatives|impediments|obstacles)-item-(\d+)$/,
  );
  if (subListMatch) {
    const i = Number(subListMatch[1]);
    const j = Number(subListMatch[2]);
    const type = subListMatch[3];
    const k = Number(subListMatch[4]);
    if (i < 0 || i >= sections.length) return null;
    const subs = sections[i]?.subsections;
    if (!Array.isArray(subs) || j < 0 || j >= subs.length) return null;
    const listKey = pluralListKey(type);
    if (!listKey) return null;
    const list = subs[j]?.[listKey];
    if (!Array.isArray(list) || k < 0 || k >= list.length) return null;
    return ['sections', i, 'subsections', j, listKey, k];
  }

  // ── Manual section item (by section index): sec-{i}-manual-{type}-item-{k} ──
  const manualMatch = fragmentId.match(
    /^sec-(\d+)-manual-(positive|negative|impediment|obstacle)-item-(\d+)$/,
  );
  if (manualMatch) {
    const i = Number(manualMatch[1]);
    const type = manualMatch[2];
    const k = Number(manualMatch[3]);
    if (i < 0 || i >= sections.length) return null;
    const listKey = manualListKey(type);
    if (!listKey) return null;
    const list = sections[i]?.[listKey];
    if (!Array.isArray(list) || k < 0 || k >= list.length) return null;
    return ['sections', i, listKey, k];
  }

  // ── Official notes item (find manual section by isManual flag): frag-official-notes-{type}-item-{k} ──
  const notesMatch = fragmentId.match(
    /^frag-official-notes-(positive|negative|impediment|obstacle)-item-(\d+)$/,
  );
  if (notesMatch) {
    const type = notesMatch[1];
    const k = Number(notesMatch[2]);
    const listKey = manualListKey(type);
    if (!listKey) return null;
    const manualIdx = sections.findIndex((s: any) => s.isManual === true);
    if (manualIdx === -1) return null;
    const list = sections[manualIdx]?.[listKey];
    if (!Array.isArray(list) || k < 0 || k >= list.length) return null;
    return ['sections', manualIdx, listKey, k];
  }

  // ── Recommendation item: frag-recommendations-group-{g}-recommendation-{r} ──
  const recMatch = fragmentId.match(
    /^frag-recommendations-group-(\d+)-recommendation-(\d+)$/,
  );
  if (recMatch) {
    const g = Number(recMatch[1]);
    const r = Number(recMatch[2]);
    const recommendations: any[] = Array.isArray(payload?.recommendations)
      ? payload.recommendations
      : [];
    if (g < 0 || g >= recommendations.length) return null;
    const recs = recommendations[g]?.recs;
    if (!Array.isArray(recs) || r < 0 || r >= recs.length) return null;
    if (typeof recs[r]?.recommendation !== 'string') return null;
    return ['recommendations', g, 'recs', r, 'recommendation'];
  }

  // ═══════════════════════════════════════════════════
  // Phase 46B — Stable Fragment ID Resolution
  // These patterns resolve stable (non-positional) fragment IDs
  // by searching the payload for matching element IDs.
  // ═══════════════════════════════════════════════════

  // ── Section title: section/{id} ──
  const secStableMatch = fragmentId.match(/^section\/([^/]+)$/);
  if (secStableMatch) {
    const secId = secStableMatch[1];
    const secIdx = sections.findIndex((s: any) => String(s?.id) === secId);
    if (secIdx < 0) return null;
    if (typeof sections[secIdx]?.title !== 'string') return null;
    return ['sections', secIdx, 'title'];
  }

  // ── Section narrative: section/{id}/narrative ──
  const secNarrativeStableMatch = fragmentId.match(/^section\/([^/]+)\/narrative$/);
  if (secNarrativeStableMatch) {
    const secId = secNarrativeStableMatch[1];
    const secIdx = sections.findIndex((s: any) => String(s?.id) === secId);
    if (secIdx < 0) return null;
    if (typeof sections[secIdx]?.narrativeText !== 'string') return null;
    return ['sections', secIdx, 'narrativeText'];
  }

  // ── Section-level list title: section/{id}/list/{type} ──
  const secListTitleStableMatch = fragmentId.match(/^section\/([^/]+)\/list\/(positive|negative|impediment|obstacle)s?$/);
  if (secListTitleStableMatch) {
    // List titles are not override targets (read-only labels).
    // Return null to silently skip.
    return null;
  }

  // ── Section-level list item: section/{id}/list/{type}/{hash} ──
  const secListItemStableMatch = fragmentId.match(/^section\/([^/]+)\/list\/(positives|negatives|impediments|obstacles)\/(.+)$/);
  if (secListItemStableMatch) {
    const secId = secListItemStableMatch[1];
    const type = secListItemStableMatch[2];
    const hash = secListItemStableMatch[3];
    const listKey = pluralListKey(type);
    if (!listKey) return null;
    const secIdx = sections.findIndex((s: any) => String(s?.id) === secId);
    if (secIdx < 0) return null;
    const list = sections[secIdx]?.[listKey];
    if (!Array.isArray(list)) return null;
    const itemIdx = list.findIndex((text: string) => simpleContentHash(text) === hash);
    if (itemIdx < 0) return null;
    return ['sections', secIdx, listKey, itemIdx];
  }

  // ── Manual section list item: section/{id}/manual/{type}/{hash} ──
  const manualStableMatch = fragmentId.match(/^section\/([^/]+)\/manual\/(positives|negatives|impediments|obstacles)\/(.+)$/);
  if (manualStableMatch) {
    const secId = manualStableMatch[1];
    const type = manualStableMatch[2];
    const hash = manualStableMatch[3];
    const listKey = pluralListKey(type);
    if (!listKey) return null;
    const secIdx = sections.findIndex((s: any) => String(s?.id) === secId);
    if (secIdx < 0) return null;
    const list = sections[secIdx]?.[listKey];
    if (!Array.isArray(list)) return null;
    const itemIdx = list.findIndex((text: string) => simpleContentHash(text) === hash);
    if (itemIdx < 0) return null;
    return ['sections', secIdx, listKey, itemIdx];
  }

  // ── Subsection title: subsection/{id} ──
  const subStableMatch = fragmentId.match(/^subsection\/([^/]+)$/);
  if (subStableMatch) {
    const subId = subStableMatch[1];
    for (let i = 0; i < sections.length; i++) {
      const subs = sections[i]?.subsections;
      if (!Array.isArray(subs)) continue;
      const j = subs.findIndex((s: any) => String(s?.id) === subId);
      if (j >= 0) {
        if (typeof subs[j]?.title !== 'string') return null;
        return ['sections', i, 'subsections', j, 'title'];
      }
    }
    return null;
  }

  // ── Subsection narrative: subsection/{id}/narrative ──
  const subNarrativeStableMatch = fragmentId.match(/^subsection\/([^/]+)\/narrative$/);
  if (subNarrativeStableMatch) {
    const subId = subNarrativeStableMatch[1];
    for (let i = 0; i < sections.length; i++) {
      const subs = sections[i]?.subsections;
      if (!Array.isArray(subs)) continue;
      const j = subs.findIndex((s: any) => String(s?.id) === subId);
      if (j >= 0) {
        if (typeof subs[j]?.narrativeText !== 'string') return null;
        return ['sections', i, 'subsections', j, 'narrativeText'];
      }
    }
    return null;
  }

  // ── Subsection finding item: subsection/{id}/finding/{hash} ──
  const subFindingStableMatch = fragmentId.match(/^subsection\/([^/]+)\/finding\/(.+)$/);
  if (subFindingStableMatch) {
    const subId = subFindingStableMatch[1];
    const hash = subFindingStableMatch[2];
    for (let i = 0; i < sections.length; i++) {
      const subs = sections[i]?.subsections;
      if (!Array.isArray(subs)) continue;
      const j = subs.findIndex((s: any) => String(s?.id) === subId);
      if (j < 0) continue;
      const findings = subs[j]?.findings;
      if (!Array.isArray(findings)) return null;
      const k = findings.findIndex((text: string) => simpleContentHash(text) === hash);
      if (k >= 0) return ['sections', i, 'subsections', j, 'findings', k];
    }
    return null;
  }

  // ── Subsection-level list item: subsection/{id}/list/{type}/{hash} ──
  const subListItemStableMatch = fragmentId.match(/^subsection\/([^/]+)\/list\/(positives|negatives|impediments|obstacles)\/(.+)$/);
  if (subListItemStableMatch) {
    const subId = subListItemStableMatch[1];
    const type = subListItemStableMatch[2];
    const hash = subListItemStableMatch[3];
    const listKey = pluralListKey(type);
    if (!listKey) return null;
    for (let i = 0; i < sections.length; i++) {
      const subs = sections[i]?.subsections;
      if (!Array.isArray(subs)) continue;
      const j = subs.findIndex((s: any) => String(s?.id) === subId);
      if (j < 0) continue;
      const list = subs[j]?.[listKey];
      if (!Array.isArray(list)) return null;
      const k = list.findIndex((text: string) => simpleContentHash(text) === hash);
      if (k >= 0) return ['sections', i, 'subsections', j, listKey, k];
    }
    return null;
  }

  // ── List-item (official notes): list-item/official_notes/{type}/{hash} ──
  const listItemStableMatch = fragmentId.match(/^list-item\/official_notes\/(positives|negatives|impediments|obstacles)\/(.+)$/);
  if (listItemStableMatch) {
    const type = listItemStableMatch[1];
    const hash = listItemStableMatch[2];
    const listKey = pluralListKey(type);
    if (!listKey) return null;
    const manualIdx = sections.findIndex((s: any) => s.isManual === true);
    if (manualIdx === -1) return null;
    const list = sections[manualIdx]?.[listKey];
    if (!Array.isArray(list)) return null;
    const k = list.findIndex((text: string) => simpleContentHash(text) === hash);
    if (k < 0) return null;
    return ['sections', manualIdx, listKey, k];
  }

  return null;
}

/**
 * Convert a manual-section category name to the payload list key.
 *   "positive"  → "positivesList"
 *   "negative"  → "negativesList"
 *   "impediment" → "impedimentsList"
 *   "obstacle"  → "obstaclesList"
 */
function manualListKey(type: string): string | null {
  switch (type) {
    case 'positive':
      return 'positivesList';
    case 'negative':
      return 'negativesList';
    case 'impediment':
      return 'impedimentsList';
    case 'obstacle':
      return 'obstaclesList';
    default:
      return null;
  }
}

/**
 * Convert a plural list-type name (matching reportFragments LIST_TYPES) to the payload list key.
 *   "positives"   → "positivesList"
 *   "negatives"   → "negativesList"
 *   "impediments" → "impedimentsList"
 *   "obstacles"   → "obstaclesList"
 */
function pluralListKey(type: string): string | null {
  switch (type) {
    case 'positives':
      return 'positivesList';
    case 'negatives':
      return 'negativesList';
    case 'impediments':
      return 'impedimentsList';
    case 'obstacles':
      return 'obstaclesList';
    default:
      return null;
  }
}

// ── Payload path helpers ──

/**
 * Walk the object along a path of property segments and return the final value.
 * Returns undefined if any intermediate segment is null/undefined/missing.
 */
function getValueAtPath(obj: any, segments: (string | number)[]): unknown {
  let current = obj;
  for (const seg of segments) {
    if (current === null || current === undefined || typeof current !== 'object')
      return undefined;
    current = current[seg];
  }
  return current;
}

/**
 * Set a value at the given path segments on the object.
 * Returns true on success, false if the parent path does not exist.
 */
function setValueAtPath(
  obj: any,
  segments: (string | number)[],
  value: unknown,
): boolean {
  if (segments.length === 0) return false;
  const parent = getValueAtPath(obj, segments.slice(0, -1));
  if (parent === null || parent === undefined || typeof parent !== 'object')
    return false;
  (parent as any)[segments[segments.length - 1]] = value;
  return true;
}

// ── Clone ──

/**
 * Deep-clone a plain-data object.
 * Uses structuredClone when available, falls back to JSON round-trip.
 */
function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}







