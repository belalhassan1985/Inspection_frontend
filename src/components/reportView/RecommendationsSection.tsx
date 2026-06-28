import React from 'react';
import {
  getIndentation,
  getLevel1Number,
  getLevel2ArabicLetter,
  getLevel3Ordinal,
  type ReportFormattingConfig,
} from '../../utils/reportNumbering';

export type RecommendationsSectionProps = {
  editMode: boolean;
  number?: string;
  recommendations: any[];
  formattingConfig: ReportFormattingConfig;
};

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  editMode,
  number,
  recommendations,
  formattingConfig,
}) => {
  return (
    <div style={{ marginBottom: '25px' }}>
      <h3 className="section-num">{number || getLevel1Number(8, formattingConfig)} التوصيات</h3>
      <div className="section-body">
        {recommendations && recommendations.length > 0 ? (
          recommendations.map((recGroup: any, grpIdx: number) => {
            if (!recGroup.visible && !editMode) return null;
            return (
              <div key={recGroup.id || grpIdx} style={{ marginBottom: '20px', marginRight: getIndentation(2, formattingConfig), opacity: recGroup.visible ? 1 : 0.5 }}>
                <div style={{ fontWeight: 'bold', color: '#0c2340', marginBottom: '8px' }}>
                  {getLevel2ArabicLetter(grpIdx + 1, formattingConfig)} {recGroup.authority}
                </div>
                <div style={{ marginRight: getIndentation(3, formattingConfig) }}>
                  {recGroup.recs && recGroup.recs.length > 0 ? (
                    recGroup.recs.map((rec: any, recIdx: number) => (
                      <div key={rec.id || recIdx} style={{ marginBottom: '10px' }}>
                        <div style={{ marginBottom: '4px', fontSize: '13.5px', fontWeight: '500' }}>
                          {getLevel3Ordinal(recIdx + 1, formattingConfig).replace('.', ':')} {rec.text}
                        </div>
                        {rec.children && rec.children.length > 0 && (
                          <div style={{ marginRight: getIndentation(4, formattingConfig), display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {rec.children.map((child: any, childIdx: number) => (
                              <div key={child.id || childIdx} style={{ fontSize: '13px', color: '#4a5568' }}>
                                • {child.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '13.5px', color: '#718096', fontStyle: 'italic', marginBottom: '10px' }}>
                      لا توجد توصيات مدخلة تحت هذه الجهة.
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ marginRight: getIndentation(2, formattingConfig), fontSize: '13.5px', color: '#718096' }}>لا توجد توصيات مدخلة.</div>
        )}
      </div>
    </div>
  );
};
