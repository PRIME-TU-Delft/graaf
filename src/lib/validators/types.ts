export type Issue = {
	id: string;
	title: string;
	message: string;
	severity: 'error' | 'warning';
};

export type Issues = {
	domainIssues: { [key: number]: Issue[] };
	domainRelationIssues: { [key: number]: { [key: number]: Issue[] } };
	subjectIssues: { [key: number]: Issue[] };
	subjectRelationIssues: { [key: number]: { [key: number]: Issue[] } };
	lectureIssues: { [key: number]: { lecture: Issue[]; subjects: { [key: number]: Issue[] } } };
};
