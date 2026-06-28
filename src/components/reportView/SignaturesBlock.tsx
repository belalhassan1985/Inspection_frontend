import React from 'react';

/**
 * SignaturesBlock — مكوّن عرض مشترك (Single Source of Truth) لكتلة التوقيعات.
 *
 * مُستخرَج حرفياً من Reports.tsx (تعديل سلوكي-محايد): نفس الـ markup ونفس الأنماط بالضبط.
 * كان مكرّراً في قالبَي التقرير (التعليمي + القياسي) بشكل متطابق تماماً؛ توحيده هنا يلغي
 * الازدواج ويجعل التوقيعات مصدراً واحداً.
 *
 * كتلة التوقيعات عنصر atomic / keepTogether: لا يجوز كسرها بين صفحتين. هذا المكوّن يعرضها
 * ككتلة واحدة متماسكة، وسيتعامل معها الـ Paginator لاحقاً كشظية atomic غير قابلة للتقسيم.
 *
 * ملاحظة: منطق التحرير (editMode + onSignatureFieldChange) ممرَّر عبر props ويبقى مملوكاً
 * لـ Reports.tsx؛ المصمّم يستهلكها قراءة فقط (editMode=false، callback فارغة).
 */
export type SignaturesBlockProps = {
  signatures: any;
  editMode: boolean;
  onSignatureFieldChange: (field: string, value: any) => void;
};

export const SignaturesBlock: React.FC<SignaturesBlockProps> = ({
  signatures: signaturesProp,
  editMode,
  onSignatureFieldChange,
}) => {
  const signatures = signaturesProp || {};
  const leaderRank = signatures.leaderRank || '';
  const leaderName = signatures.leaderName || '';
  const leaderRole = signatures.leaderRole || 'رئيس اللجنة';
  const leaderDate = signatures.leaderDate || '';

  const deputyRank = signatures.deputyRank || '';
  const deputyName = signatures.deputyName || '';
  const deputyRole = signatures.deputyRole || 'رئيس هيئة تفتيش قوى الامن الداخلي';
  const deputyDate = signatures.deputyDate || '';

  const showMinisterSign = signatures.showMinisterSign !== false;
  const ministerTitle = signatures.ministerTitle || 'اصادق اصوليا';
  const ministerName = signatures.ministerName || 'وزيـــــــر الداخلية';
  const ministerDate = signatures.ministerDate || '٢٠٢٦/  / ';

  return (
    <div style={{ marginTop: '60px', borderTop: '1px dashed #cbd5e0', paddingTop: '20px' }}>
      {/* Minister Signature Toggle and Inputs in Edit Mode */}
      {editMode && (
        <div className="no-print" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={showMinisterSign}
              onChange={(e) => onSignatureFieldChange('showMinisterSign', e.target.checked)}
            />
            إظهار توقيع مصادقة وزير الداخلية في أعلى يسار التذييل
          </label>
          {showMinisterSign && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>عبارة المصادقة:</label>
                <input
                  type="text"
                  value={ministerTitle}
                  onChange={(e) => onSignatureFieldChange('ministerTitle', e.target.value)}
                  style={{ width: '100%', border: '1px solid #cbd5e0', padding: '5px', borderRadius: '4px', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>منصب المصادق:</label>
                <input
                  type="text"
                  value={ministerName}
                  onChange={(e) => onSignatureFieldChange('ministerName', e.target.value)}
                  style={{ width: '100%', border: '1px solid #cbd5e0', padding: '5px', borderRadius: '4px', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>التاريخ:</label>
                <input
                  type="text"
                  value={ministerDate}
                  onChange={(e) => onSignatureFieldChange('ministerDate', e.target.value)}
                  style={{ width: '100%', border: '1px solid #cbd5e0', padding: '5px', borderRadius: '4px', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Minister Signature in Preview Mode */}
      {showMinisterSign && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '25px', paddingLeft: '5%' }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            {editMode ? (
              <div style={{ color: '#718096', fontSize: '12px', border: '1px dashed #cbd5e0', padding: '5px', display: 'inline-block' }}>
                (توقيع مصادقة وزير الداخلية - معروض أعلاه)
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 5px 0' }}><strong>{ministerTitle}</strong></p>
                <p style={{ margin: '0 0 5px 0', fontSize: '15px' }}><strong>{ministerName}</strong></p>
                <p style={{ margin: '0', fontSize: '12px', color: '#4a5568' }}>
                  <span dir="ltr" style={{ direction: 'ltr', display: 'inline-block' }}>{ministerDate}</span>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Two Columns: Leader (Right) and Deputy (Left) */}
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
        {/* Right Column: Leader */}
        <div data-signer-idx="0" style={{ textAlign: 'center', width: '45%' }}>
          {editMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
              <input
                type="text"
                value={leaderRank}
                onChange={(e) => onSignatureFieldChange('leaderRank', e.target.value)}
                placeholder="الرتبة / العنوان الوظيفي"
                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontWeight: 'bold' }}
              />
              <input
                type="text"
                value={leaderName}
                onChange={(e) => onSignatureFieldChange('leaderName', e.target.value)}
                placeholder="الاسم الكامل"
                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit' }}
              />
              <input
                type="text"
                value={leaderRole}
                onChange={(e) => onSignatureFieldChange('leaderRole', e.target.value)}
                placeholder="الصفة باللجنة"
                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontWeight: 'bold' }}
              />
              <input
                type="text"
                value={leaderDate}
                onChange={(e) => onSignatureFieldChange('leaderDate', e.target.value)}
                placeholder="التاريخ"
                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontSize: '11px', color: '#4a5568' }}
              />
            </div>
          ) : (
            <>
              <div style={{ height: '55px' }}></div>
              <p style={{ margin: '0 0 5px 0' }}><strong data-field="rank">{leaderRank || ' '}</strong></p>
              <p data-field="name" style={{ margin: '0 0 5px 0' }}>{leaderName}</p>
              <p style={{ margin: '0 0 5px 0' }}><strong data-field="role">{leaderRole}</strong></p>
              <p style={{ fontSize: '11px', color: '#4a5568', margin: 0 }}>
                <span dir="ltr" style={{ direction: 'ltr', display: 'inline-block' }}>{leaderDate}</span>
              </p>
            </>
          )}
        </div>

        {/* Left Column: Deputy */}
        <div data-signer-idx="1" style={{ textAlign: 'center', width: '45%' }}>
          {editMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
              <input
                type="text"
                value={deputyRank}
                onChange={(e) => onSignatureFieldChange('deputyRank', e.target.value)}
                placeholder="الرتبة / العنوان الوظيفي"
                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontWeight: 'bold' }}
              />
              <input
                type="text"
                value={deputyName}
                onChange={(e) => onSignatureFieldChange('deputyName', e.target.value)}
                placeholder="الاسم الكامل"
                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit' }}
              />
              <input
                type="text"
                value={deputyRole}
                onChange={(e) => onSignatureFieldChange('deputyRole', e.target.value)}
                placeholder="الصفة باللجنة"
                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontWeight: 'bold' }}
              />
              <input
                type="text"
                value={deputyDate}
                onChange={(e) => onSignatureFieldChange('deputyDate', e.target.value)}
                placeholder="التاريخ"
                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontSize: '11px', color: '#4a5568' }}
              />
            </div>
          ) : (
            <>
              <div style={{ height: '55px' }}></div>
              <p style={{ margin: '0 0 5px 0' }}><strong data-field="rank">{deputyRank || ' '}</strong></p>
              <p data-field="name" style={{ margin: '0 0 5px 0' }}>{deputyName}</p>
              <p style={{ margin: '0 0 5px 0' }}><strong data-field="role">{deputyRole}</strong></p>
              <p style={{ fontSize: '11px', color: '#4a5568', margin: 0 }}>
                <span dir="ltr" style={{ direction: 'ltr', display: 'inline-block' }}>{deputyDate}</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
