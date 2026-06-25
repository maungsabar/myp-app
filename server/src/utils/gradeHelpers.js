// MYP Grade Boundaries (standard, max 32 = 4 criteria × 8)
export const gradeBoundaries = [
  { grade: 1, min: 0, max: 5, label: "Produces work of very limited quality." },
  { grade: 2, min: 6, max: 9, label: "Produces work of limited quality." },
  { grade: 3, min: 10, max: 14, label: "Produces work of an acceptable quality." },
  { grade: 4, min: 15, max: 18, label: "Produces good-quality work." },
  { grade: 5, min: 19, max: 23, label: "Produces generally high-quality work." },
  { grade: 6, min: 24, max: 27, label: "Produces high-quality, occasionally innovative work." },
  { grade: 7, min: 28, max: 32, label: "Produces high-quality, frequently innovative work." },
];

export const ALL_CRITERIA = ['A', 'B', 'C', 'D'];

export function getCriteriaKeys(count = 4) {
  return ALL_CRITERIA.slice(0, count);
}

export function calculateGrade(totalScore) {
  const b = gradeBoundaries.find(b => totalScore >= b.min && totalScore <= b.max);
  return b ? b.grade : null;
}

export function calculateGradeDynamic(totalScore, numCriteria = 4) {
  if (numCriteria === 4) return calculateGrade(totalScore);
  const maxScore = numCriteria * 8;
  const scale = maxScore / 32;
  const b = gradeBoundaries.find(b =>
    totalScore >= Math.round(b.min * scale) && totalScore <= Math.round(b.max * scale)
  );
  return b ? b.grade : null;
}

export function getLocalGrade(finalGrade) {
  const map = { 1: "E", 2: "D", 3: "C", 4: "B", 5: "B+", 6: "A", 7: "A+" };
  return map[finalGrade] || "-";
}

export function getScaledBoundaries(numCriteria = 4) {
  if (numCriteria === 4) return gradeBoundaries;
  const scale = (numCriteria * 8) / 32;
  return gradeBoundaries.map(b => ({
    ...b,
    min: Math.round(b.min * scale),
    max: Math.round(b.max * scale),
  }));
}

export function getCriteriaCount(subject, gradeLevel) {
  if (!subject) return 4;
  if (subject.criteriaConfig && gradeLevel != null) {
    const gl = typeof gradeLevel === 'string' ? parseInt(gradeLevel) : gradeLevel;
    if (subject.criteriaConfig[gl] != null) return subject.criteriaConfig[gl];
    return subject.criteriaConfig.default || 4;
  }
  if (subject.criteriaCount != null) return subject.criteriaCount;
  return 4;
}
