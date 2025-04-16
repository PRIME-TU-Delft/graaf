// This is the data that is uploaded to the database once initted
// Run the following command to upload the data:
// pnpm prisma db seed

import { ParentType } from '@prisma/client';

export const subjects = [
	{ name: 'SubjectOne' },
	{ name: 'SubjectTwo' },
	{ name: 'SubjectThree' },
	{ name: 'SubjectFour' }
];

export const domains = [
	{ name: 'DomainOne' },
	{ name: 'DomainTwo' },
	{ name: 'DomainThree' },
	{ name: 'DomainFour' }
];

export const graph = [
	{
		name: 'GraphOne',
		parentType: ParentType
	}
];

export const courses = [
	{
		code: 'CS1000',
		name: 'CourseOne'
	},
	{
		code: 'CS2000',
		name: 'CourseTwo'
	},
	{
		code: 'WBMT1050',
		name: 'CourseThree'
	},
	{
		code: 'BK1100',
		name: 'CourseFour'
	}
];

export const programs = [
	{
		name: 'ProgramOne',
		courses: [courses[0], courses[1], courses[2], courses[3]]
	},
	{
		name: 'ProgramTwo',
		courses: [courses[1], courses[2]]
	},
	{
		name: 'ProgramThree',
		courses: []
	},
	{
		name: 'ProgramFour',
		courses: [courses[3]]
	}
];
