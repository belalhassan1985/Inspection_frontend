import React from 'react';
import { getLevel1Number, type ReportFormattingConfig } from '../../utils/reportNumbering';

export type FinalEvaluationSectionProps = {
  number?: string;
  finalEvaluation: any;
  formattingConfig: ReportFormattingConfig;
};

export const FinalEvaluationSection: React.FC<FinalEvaluationSectionProps> = ({
  number,
  finalEvaluation,
  formattingConfig,
}) => {
  if (!finalEvaluation?.statement) return null;

  return (
    <div style={{ marginTop: '25px', marginBottom: '25px' }}>
      <h3 className="section-num">{number || getLevel1Number(10, formattingConfig)} {finalEvaluation.statement}</h3>
    </div>
  );
};
