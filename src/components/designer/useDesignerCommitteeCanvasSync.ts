import { useEffect } from 'react';
import type { RefObject } from 'react';
import {
  COMMITTEE_CONTENT_ID,
  COMMITTEE_STYLE_ID,
  parseCommitteeMemberDraft,
  readCommitteeOverride,
} from './types';
import type { CommitteeMemberDraft, ElementStyleOverride } from './types';

interface UseDesignerCommitteeCanvasSyncParams {
  previewScopeRef: RefObject<HTMLDivElement | null>;
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reportPayload: any;
  renderedPagesCount: number;
}

export function useDesignerCommitteeCanvasSync({
  previewScopeRef,
  elementTextOverrides,
  elementStyleOverrides,
  reportPayload,
  renderedPagesCount,
}: UseDesignerCommitteeCanvasSyncParams): void {
  useEffect(() => {
    const root = previewScopeRef.current;
    const committeeFragment = root?.querySelector<HTMLElement>('[data-frag-id="frag-committee"]');
    if (!committeeFragment) return;

    const overrideMembers = readCommitteeOverride(elementTextOverrides[COMMITTEE_CONTENT_ID]);
    const members: CommitteeMemberDraft[] = overrideMembers || (Array.isArray(reportPayload?.committeeMembers) ? reportPayload.committeeMembers.map((member: string) => parseCommitteeMemberDraft(member)) : []);
    const tableBody = committeeFragment.querySelector<HTMLTableSectionElement>('tbody');
    if (tableBody && overrideMembers) {
      tableBody.replaceChildren();
      members.forEach((member) => {
        const row = document.createElement('tr');
        const rankCell = document.createElement('td');
        const nameCell = document.createElement('td');
        const roleCell = document.createElement('td');
        [rankCell, nameCell, roleCell].forEach((cell) => {
          cell.style.setProperty('border', 'none');
          cell.style.setProperty('padding', '4px 0');
          cell.style.setProperty('font-size', '15px');
          cell.style.setProperty('text-align', 'right');
        });
        rankCell.style.setProperty('width', '20%');
        nameCell.style.setProperty('width', '45%');
        roleCell.style.setProperty('width', '35%');
        rankCell.textContent = member.rank;
        nameCell.textContent = member.name;
        roleCell.textContent = member.role;
        row.append(rankCell, nameCell, roleCell);
        tableBody.append(row);
      });
    }

    const styleOverride = elementStyleOverrides[COMMITTEE_STYLE_ID];
    committeeFragment.querySelectorAll<HTMLElement>('tbody td').forEach((cell) => {
      if (styleOverride?.tableFontSize !== undefined) cell.style.setProperty('font-size', `${styleOverride.tableFontSize}px`, 'important');
      if (styleOverride?.paragraphColor) cell.style.setProperty('color', styleOverride.paragraphColor, 'important');
      if (styleOverride?.tableFontWeight) cell.style.setProperty('font-weight', styleOverride.tableFontWeight, 'important');
    });
  }, [elementTextOverrides, elementStyleOverrides, reportPayload, renderedPagesCount]);
}
