import { departments } from "@/data/departments";
import {
  applyDepartmentStats,
  mergeSharedPapers,
  sortExamPeriods,
  sortPapersByDate,
} from "@/lib/papers";

// What the home page shows, worked out from the whole archive. The server computes it so the
// browser receives a few hundred bytes instead of every paper.
export function summarizeArchive(papers) {
  const periods = new Set(papers.map((paper) => paper.examPeriod).filter(Boolean));
  const dated = sortPapersByDate(papers).filter((paper) => paper.createdAt);
  return {
    departmentList: applyDepartmentStats(departments, papers),
    examPeriods: sortExamPeriods(Array.from(periods)),
    recentPapers: mergeSharedPapers(dated).slice(0, 4),
    tally: {
      // Shared papers filed under several departments count once.
      papers: mergeSharedPapers(papers).length,
      subjects: new Set(papers.map((paper) => paper.courseCode).filter(Boolean)).size,
      periods: periods.size,
    },
  };
}
