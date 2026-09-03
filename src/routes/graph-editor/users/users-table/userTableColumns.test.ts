import { describe, expect, it } from 'vitest';
import { comparePrivilegeRank, privilegeRank } from './userTableColumns';
import type { DataUser } from './userTableColumns';

function makeUser(partial: Partial<DataUser> = {}) {
	return {
		id: 'u1',
		role: 'USER',
		nickname: null,
		firstName: null,
		lastName: null,
		email: 'user@tudelft.nl',
		emailVerified: null,
		image: null,
		createdAt: new Date(0),
		updatedAt: new Date(0),
		program_admins: [],
		program_editors: [],
		course_admins: [],
		course_editors: [],
		...partial
	} as DataUser;
}

function program(id: number) {
	return {
		id,
		name: `Program ${id}`,
		createdAt: new Date(0),
		updatedAt: new Date(0)
	} as DataUser['program_admins'][number];
}

function course(id: number) {
	return {
		id,
		code: `C${id}`,
		uriCode: `c${id}`,
		name: `Course ${id}`,
		isArchived: false,
		createdAt: new Date(0),
		updatedAt: new Date(0)
	} as DataUser['course_admins'][number];
}

describe('privilege sorting', () => {
	it('ranks a plain super admin above a course admin of several courses', () => {
		const superAdmin = makeUser({ role: 'ADMIN' });
		const courseAdmin = makeUser({
			course_admins: [course(1), course(2), course(3), course(4)]
		});

		expect(
			comparePrivilegeRank(privilegeRank(superAdmin), privilegeRank(courseAdmin))
		).toBeGreaterThan(0);
	});

	it('breaks a tie at the super-admin tier using the program-admin count', () => {
		const twoPrograms = makeUser({ role: 'ADMIN', program_admins: [program(1), program(2)] });
		const onePrograms = makeUser({ role: 'ADMIN', program_admins: [program(1)] });

		expect(
			comparePrivilegeRank(privilegeRank(twoPrograms), privilegeRank(onePrograms))
		).toBeGreaterThan(0);
	});

	it('does not let a lower tier outweigh a higher tier', () => {
		// Many course roles but no program roles, vs one program-admin role and no course roles
		const manyCourseRoles = makeUser({
			course_admins: [course(1), course(2)],
			course_editors: [course(3), course(4), course(5)]
		});
		const oneProgramAdmin = makeUser({ program_admins: [program(1)] });

		expect(
			comparePrivilegeRank(privilegeRank(oneProgramAdmin), privilegeRank(manyCourseRoles))
		).toBeGreaterThan(0);
	});

	it('treats two users with identical privileges as equal', () => {
		const a = makeUser({ role: 'ADMIN', program_admins: [program(1)] });
		const b = makeUser({ role: 'ADMIN', program_admins: [program(2)] });

		expect(comparePrivilegeRank(privilegeRank(a), privilegeRank(b))).toBe(0);
	});

	it('ranks a user with no privileges lowest', () => {
		const none = makeUser();
		const courseEditor = makeUser({ course_editors: [course(1)] });

		expect(comparePrivilegeRank(privilegeRank(none), privilegeRank(courseEditor))).toBeLessThan(0);
	});
});
