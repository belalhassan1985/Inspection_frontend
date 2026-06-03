export function pruneTemplateTree(template: any[], gradesMap: Map<number, any>): any[] {
  // Deep clone template to avoid mutating cached state
  const cloned = JSON.parse(JSON.stringify(template));

  return cloned
    .map((pri: any) => {
      if (pri.secondaryCriteria) {
        pri.secondaryCriteria = pri.secondaryCriteria
          .map((sec: any) => {
            if (sec.details) {
              sec.details = sec.details.filter((det: any) => {
                const grade = gradesMap.get(det.id);
                if (!grade) return false;

                const score = grade.gradeEarned !== null ? parseFloat(grade.gradeEarned.toString()) : 0;
                const hasScore = score > 0;
                const hasNotes = grade.notes && grade.notes.trim() !== '';
                const hasSelectedOptions = grade.selectedOptions && grade.selectedOptions.length > 0;

                return hasScore || hasNotes || hasSelectedOptions;
              });
            }
            return sec;
          })
          .filter((sec: any) => sec.details && sec.details.length > 0);
      }
      return pri;
    })
    .filter((pri: any) => pri.secondaryCriteria && pri.secondaryCriteria.length > 0);
}
