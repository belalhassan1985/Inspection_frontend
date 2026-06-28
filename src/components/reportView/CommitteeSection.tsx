import React from 'react';

/**
 * CommitteeSection — مكوّن عرض مشترك (Single Source of Truth) لقسم "التأليف" (أعضاء اللجنة).
 *
 * مُستخرَج حرفياً من القالب التعليمي في Reports.tsx (تعديل سلوكي-محايد).
 *
 * الترقيم: `number` (getLevel1Number(2)) يُمرَّر محسوباً مسبقاً؛ المكوّن لا يزيد أي عدّاد.
 * الأنماط السطرية لـ section-num/section-body مطابقة لتعريف الصنف (انظر AssignmentSection).
 */
const SECTION_NUM_STYLE: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0c2340',
  marginTop: '30px',
  marginBottom: '10px',
};

const SECTION_BODY_STYLE: React.CSSProperties = {
  marginRight: '15px',
  marginBottom: '20px',
  textAlign: 'justify',
};

/** نسخة خالصة مطابقة لمُحلّل أعضاء اللجنة في Reports.tsx. */
const parseCommitteeMember = (member: string) => {
  const cleanMember = member.replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '').trim();
  const parts = cleanMember.split(/\s{2,}/);
  if (parts.length >= 2) {
    return { name: parts[0].trim(), role: parts.slice(1).join(' ').trim() };
  }
  const roles = ['رئيس اللجنة', 'رئيـس اللجنة', 'معاون اللجنة', 'معـاون اللجنة', 'عضو اللجنة', 'عضو', 'عضواً', 'عضـــــــــواً'];
  for (const role of roles) {
    if (cleanMember.endsWith(role)) {
      const name = cleanMember.substring(0, cleanMember.length - role.length).trim();
      return { name, role };
    }
  }
  return { name: cleanMember, role: '' };
};

export type CommitteeSectionProps = {
  editMode: boolean;
  number: string;
  committeeMembers: string[];
  onMemberChange: (idx: number, value: string) => void;
  onAddMember: () => void;
  onRemoveMember: (idx: number) => void;
};

export const CommitteeSection: React.FC<CommitteeSectionProps> = ({
  editMode,
  number,
  committeeMembers,
  onMemberChange,
  onAddMember,
  onRemoveMember,
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 className="section-num" style={SECTION_NUM_STYLE}>{number} التــــأليف</h3>
      <div className="section-body" style={SECTION_BODY_STYLE}>
        {editMode ? (
          <div>
            {committeeMembers.map((member: string, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={member.replace(/&nbsp;/g, ' ')}
                  onChange={(e) => onMemberChange(idx, e.target.value)}
                  style={{
                    flex: 1,
                    border: '1px dashed #cbd5e0',
                    borderRadius: '4px',
                    padding: '5px',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => onRemoveMember(idx)}
                  className="no-print"
                  style={{
                    backgroundColor: '#fed7d7',
                    color: '#c53030',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                  }}
                >
                  حذف
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={onAddMember}
              className="btn-outline no-print"
              style={{ padding: '6px 12px', fontSize: '12px', marginTop: '5px' }}
            >
              ➕ إضافة عضو لجنة
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', maxWidth: '650px', borderCollapse: 'collapse', border: 'none', marginTop: '10px' }}>
            <tbody>
              {committeeMembers.map((member: string, idx: number) => {
                const parsed = parseCommitteeMember(member);
                return (
                  <tr key={idx}>
                    <td style={{ border: 'none', padding: '4px 0', fontSize: '15px', width: '60%', textAlign: 'right' }}>
                      {parsed.name}
                    </td>
                    <td style={{ border: 'none', padding: '4px 0', fontSize: '15px', width: '40%', textAlign: 'right' }}>
                      {parsed.role}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
