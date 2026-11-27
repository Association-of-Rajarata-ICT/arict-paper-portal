// The archive is sent to the browser with every Past Papers page. As objects it made those pages
// about 1.9 MB, close to the 2 MB that Googlebot reads, so it travels as plain rows: only the
// values that can't be rebuilt from each other, without repeated field names.
export function packPapers(papers) {
  return papers.map((paper) => [
    paper.id,
    paper.courseCode,
    paper.title,
    paper.instructor,
    paper.department,
    paper.yearNumber,
    paper.semesterNumber,
    paper.examPeriod,
    paper.driveFileId,
  ]);
}

export function unpackPapers(rows) {
  return rows.map(
    ([id, courseCode, title, instructor, department, yearNumber, semesterNumber, examPeriod, driveFileId]) => ({
      id,
      docId: id,
      courseCode,
      title,
      instructor,
      department,
      departmentFull: department,
      academicYear: `Year ${yearNumber}`,
      semester: `Semester ${semesterNumber}`,
      yearNumber,
      semesterNumber,
      examPeriod,
      driveLink: driveFileId ? `https://drive.google.com/file/d/${driveFileId}/view` : "",
    })
  );
}
