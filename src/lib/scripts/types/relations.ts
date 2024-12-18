export type ProgramRelation = 'courses' | 'editors' | 'admins';
export type CourseRelation = 'programs' | 'graphs' | 'links' | 'editors' | 'admins';
export type GraphRelation = 'course' | 'domains' | 'subjects' | 'lectures' | 'links';
export type DomainRelation = 'graph' | 'parents' | 'children' | 'subjects';
export type SubjectRelation = 'graph' | 'parents' | 'children' | 'domain' | 'lectures';
export type LectureRelation = 'graph' | 'subjects';
export type LinkRelation = 'course' | 'graph';
export type UserRelation =
	| 'program_editors'
	| 'program_admins'
	| 'course_editors'
	| 'course_admins';
