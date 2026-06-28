export const getIntroductionParagraphConfig = (nodeId: string | null, reportPayload: any) => {
  if (nodeId === 'assignment') {
    return { nodeId, label: 'ط·آ§ط¸â€‍ط·ع¾ط¸ئ’ط¸â€‍ط¸ظ¹ط¸ظ¾', elementId: 'frag-assignment:paragraph:0', baseText: String(reportPayload?.assignmentText || '') };
  }
  if (nodeId === 'purpose') {
    return { nodeId, label: 'ط·آ§ط¸â€‍ط·ط›ط·آ§ط¸ظ¹ط·آ©', elementId: 'frag-purpose:paragraph:0', baseText: String(reportPayload?.purposeText || '') };
  }
  if (nodeId === 'visit-date') {
    return { nodeId, label: 'ط·ع¾ط·آ§ط·آ±ط¸ظ¹ط·آ® ط·آ§ط¸â€‍ط·ع¾ط¸ظ¾ط·ع¾ط¸ظ¹ط·آ´', elementId: 'frag-visit-date:paragraph:0', baseText: String(reportPayload?.durationText || '') };
  }
  return null;
};
