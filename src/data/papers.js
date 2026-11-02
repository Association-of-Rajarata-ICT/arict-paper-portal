import { textMatchesQuery } from "@/lib/papers";

export const papers = [
  {
    id: "cs305",
    courseCode: "CS305",
    title: "Advanced Data Structures and Algorithms",
    description:
      "Comprehensive past paper covering graph theory, dynamic programming, and complex data models utilized in the 2023 final assessment. Detailed analysis of algorithmic complexity and optimization techniques.",
    year: "2023",
    department: "CS Dept",
    departmentFull: "Computer Science",
    semester: "Semester 1",
    duration: "3 Hours",
    fileSize: "1.2 MB",
    difficulty: "Advanced",
    type: "Final Exam",
    isRestricted: false,
  },
  {
    id: "cs201",
    courseCode: "CS201",
    title: "Introduction to Software Engineering",
    description:
      "Covers software development lifecycles, design patterns, and agile methodologies with a focus on practical implementation. Students are tested on their ability to apply engineering principles.",
    year: "2023",
    department: "CS Dept",
    departmentFull: "Computer Science",
    semester: "Semester 1",
    duration: "2 Hours",
    fileSize: "980 KB",
    difficulty: "Intermediate",
    type: null,
    isRestricted: false,
  },
  {
    id: "cs310",
    courseCode: "CS310",
    title: "Machine Learning Foundations",
    description:
      "Includes foundational concepts of neural networks, supervised learning, and data preprocessing techniques. This assessment focuses on linear regression models, classification algorithms, and model evaluation.",
    year: "2022",
    department: "CS Dept",
    departmentFull: "Computer Science",
    semester: "Semester 2",
    duration: "3 Hours",
    fileSize: "1.5 MB",
    difficulty: "Advanced",
    type: null,
    isRestricted: false,
  },
  {
    id: "cs405",
    courseCode: "CS405",
    title: "Cryptography and Network Security",
    description:
      "Focuses on symmetric key cryptography, network security protocols, and vulnerability assessment methods. It includes practical scenarios involving RSA encryption and firewall configurations.",
    year: "2023",
    department: "CS Dept",
    departmentFull: "Computer Science",
    semester: "Semester 2",
    duration: "3 Hours",
    fileSize: "1.1 MB",
    difficulty: "Advanced",
    type: null,
    isRestricted: true,
  },
  {
    id: "cs102",
    courseCode: "CS102",
    title: "Object Oriented Programming",
    description:
      "Introduction to class hierarchies, inheritance, polymorphism, and solid principles in modern programming. This module emphasizes the transition from procedural to object-oriented paradigms.",
    year: "2021",
    department: "CS Dept",
    departmentFull: "Computer Science",
    semester: "Semester 1",
    duration: "2 Hours",
    fileSize: "750 KB",
    difficulty: "Easy",
    type: null,
    isRestricted: false,
  },
  {
    id: "com3021",
    courseCode: "COM3021",
    title: "Data Structures & Algorithms",
    description:
      "Comprehensive examination covering arrays, linked lists, trees, graphs, sorting algorithms, and algorithmic analysis. Emphasis on practical problem-solving and time complexity.",
    year: "2022/2023",
    department: "Computing",
    departmentFull: "Computer Science",
    semester: "Semester 1",
    duration: "2 Hours",
    fileSize: "1.2 MB",
    difficulty: "Advanced",
    type: "Past Paper",
    isRestricted: false,
  },
  {
    id: "com3022",
    courseCode: "COM3022",
    title: "Database Management Systems",
    description:
      "Covers relational database design, SQL queries, normalization, transaction management, and database security. Includes practical scenarios involving complex queries and database optimization.",
    year: "2022/2023",
    department: "Computing",
    departmentFull: "Computer Science",
    semester: "Semester 1",
    duration: "2 Hours",
    fileSize: "1.0 MB",
    difficulty: "Intermediate",
    type: "Past Paper",
    isRestricted: false,
  },
  {
    id: "com3025",
    courseCode: "COM3025",
    title: "Software Engineering",
    description:
      "Examines software development methodologies, requirements engineering, system design, testing strategies, and project management. Focuses on real-world application of engineering principles.",
    year: "2022/2023",
    department: "Computing",
    departmentFull: "Computer Science",
    semester: "Semester 2",
    duration: "2 Hours",
    fileSize: "900 KB",
    difficulty: "Intermediate",
    type: "Past Paper",
    isRestricted: false,
  },
  {
    id: "net201",
    courseCode: "NET201",
    title: "Computer Networks Fundamentals",
    description:
      "Covers the OSI model, TCP/IP protocol suite, network topologies, routing algorithms, and subnet calculations. Practical networking scenarios are included.",
    year: "2023",
    department: "CS Dept",
    departmentFull: "Networking",
    semester: "Semester 1",
    duration: "2 Hours",
    fileSize: "850 KB",
    difficulty: "Intermediate",
    type: null,
    isRestricted: false,
  },
  {
    id: "net304",
    courseCode: "NET304",
    title: "Wireless and Mobile Computing",
    description:
      "Examines wireless communication protocols, mobile application architectures, cellular network technologies, and IoT connectivity standards.",
    year: "2023",
    department: "CS Dept",
    departmentFull: "Networking",
    semester: "Semester 2",
    duration: "3 Hours",
    fileSize: "1.3 MB",
    difficulty: "Advanced",
    type: null,
    isRestricted: false,
  },
  {
    id: "ds101",
    courseCode: "DS101",
    title: "Introduction to Data Analytics",
    description:
      "Covers statistical foundations, data visualization techniques, exploratory data analysis, and introduction to tools like Python and R for data manipulation.",
    year: "2023",
    department: "CS Dept",
    departmentFull: "Data Science",
    semester: "Semester 1",
    duration: "2 Hours",
    fileSize: "920 KB",
    difficulty: "Easy",
    type: null,
    isRestricted: false,
  },
  {
    id: "se201",
    courseCode: "SE201",
    title: "Software Design Patterns",
    description:
      "Examines creational, structural, and behavioral design patterns. Covers SOLID principles, clean architecture, and practical implementation using Java and Python.",
    year: "2023",
    department: "CS Dept",
    departmentFull: "Software Engineering",
    semester: "Semester 1",
    duration: "2 Hours",
    fileSize: "1.0 MB",
    difficulty: "Intermediate",
    type: null,
    isRestricted: false,
  },
];

export function getPaperById(id) {
  return papers.find((p) => p.id === id);
}

export function getRelatedPapers(currentId, limit = 3) {
  return papers.filter((p) => p.id !== currentId).slice(0, limit);
}

export function filterPapers(sourcePapers = [], query, filters = {}) {
  let results = [...sourcePapers];

  if (query) {
    results = results.filter((p) =>
      textMatchesQuery(
        [
          p.title,
          p.courseCode,
          ...(p.departments || [p.departmentFull]),
          p.department,
          p.description,
          p.instructor,
        ],
        query
      )
    );
  }

  if (filters.departments && filters.departments.length > 0) {
    results = results.filter((p) =>
      filters.departments.includes(p.departmentFull)
    );
  }

  if (filters.years && filters.years.length > 0) {
    results = results.filter((p) => filters.years.includes(p.year));
  }

  return results;
}

export function searchPapers(query, filters = {}) {
  return filterPapers(papers, query, filters);
}
