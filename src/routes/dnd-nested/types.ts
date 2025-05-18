export type SubjectType = {
	id: number;
	name: string;
};

export type LectureType = {
	id: number;
	name: string;
	subjects: SubjectType[];
};
