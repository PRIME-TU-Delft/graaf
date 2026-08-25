import { describe, expect, it } from 'vitest';
import type { User } from '@prisma/client';
import {
	whereHasProgramPermission,
	whereHasCoursePermission,
	whereHasGraphCoursePermission,
	whereHasSandboxPermission
} from './permissions';

function makeUser(role: User['role'], id = 'user-1'): User {
	return { id, role } as User;
}

const ADMIN = makeUser('ADMIN');
const USER = makeUser('USER');

describe('whereHasProgramPermission', () => {
	it('returns {} for super-admin regardless of tier', () => {
		expect(whereHasProgramPermission(ADMIN, 'OnlySuperAdmin')).toEqual({});
		expect(whereHasProgramPermission(ADMIN, 'ProgramAdmin')).toEqual({});
		expect(whereHasProgramPermission(ADMIN, 'ProgramAdminEditor')).toEqual({});
	});

	it('throws for non-admin user requesting OnlySuperAdmin', () => {
		expect(() => whereHasProgramPermission(USER, 'OnlySuperAdmin')).toThrow();
	});

	it('ProgramAdmin returns only the admin fragment', () => {
		expect(whereHasProgramPermission(USER, 'ProgramAdmin')).toEqual({
			OR: [{ admins: { some: { id: USER.id } } }]
		});
	});

	it('ProgramAdminEditor returns admin and editor fragments', () => {
		expect(whereHasProgramPermission(USER, 'ProgramAdminEditor')).toEqual({
			OR: [{ admins: { some: { id: USER.id } } }, { editors: { some: { id: USER.id } } }]
		});
	});
});

describe('whereHasCoursePermission', () => {
	it('returns {} for super-admin regardless of tier', () => {
		expect(whereHasCoursePermission(ADMIN, 'OnlySuperAdmin')).toEqual({});
		expect(whereHasCoursePermission(ADMIN, 'ProgramAdmin')).toEqual({});
		expect(whereHasCoursePermission(ADMIN, 'ProgramAdminEditor')).toEqual({});
		expect(whereHasCoursePermission(ADMIN, 'CourseAdminORProgramAdminEditor')).toEqual({});
		expect(whereHasCoursePermission(ADMIN, 'CourseAdminEditorORProgramAdminEditor')).toEqual({});
	});

	it('throws for non-admin user requesting OnlySuperAdmin', () => {
		expect(() => whereHasCoursePermission(USER, 'OnlySuperAdmin')).toThrow();
	});

	it('ProgramAdmin returns only the program-admin fragment', () => {
		expect(whereHasCoursePermission(USER, 'ProgramAdmin')).toEqual({
			OR: [{ programs: { some: { admins: { some: { id: USER.id } } } } }]
		});
	});

	it('ProgramAdminEditor adds the program-editor fragment', () => {
		expect(whereHasCoursePermission(USER, 'ProgramAdminEditor')).toEqual({
			OR: [
				{ programs: { some: { admins: { some: { id: USER.id } } } } },
				{ programs: { some: { editors: { some: { id: USER.id } } } } }
			]
		});
	});

	it('CourseAdminORProgramAdminEditor adds the course-admin fragment', () => {
		expect(whereHasCoursePermission(USER, 'CourseAdminORProgramAdminEditor')).toEqual({
			OR: [
				{ programs: { some: { admins: { some: { id: USER.id } } } } },
				{ programs: { some: { editors: { some: { id: USER.id } } } } },
				{ admins: { some: { id: USER.id } } }
			]
		});
	});

	it('CourseAdminEditorORProgramAdminEditor adds the course-editor fragment', () => {
		expect(whereHasCoursePermission(USER, 'CourseAdminEditorORProgramAdminEditor')).toEqual({
			OR: [
				{ programs: { some: { admins: { some: { id: USER.id } } } } },
				{ programs: { some: { editors: { some: { id: USER.id } } } } },
				{ admins: { some: { id: USER.id } } },
				{ editors: { some: { id: USER.id } } }
			]
		});
	});
});

describe('whereHasGraphCoursePermission', () => {
	it('returns {} for super-admin regardless of tier', () => {
		expect(whereHasGraphCoursePermission(ADMIN, 'OnlySuperAdmin')).toEqual({});
		expect(whereHasGraphCoursePermission(ADMIN, 'CourseAdminEditorORProgramAdminEditor')).toEqual(
			{}
		);
	});

	it('throws for non-admin user requesting OnlySuperAdmin', () => {
		expect(() => whereHasGraphCoursePermission(USER, 'OnlySuperAdmin')).toThrow();
	});

	it('nests the course-permission fragment under course', () => {
		expect(whereHasGraphCoursePermission(USER, 'CourseAdminORProgramAdminEditor')).toEqual({
			course: whereHasCoursePermission(USER, 'CourseAdminORProgramAdminEditor')
		});
	});

	it('nests the highest course-permission tier under course', () => {
		expect(whereHasGraphCoursePermission(USER, 'CourseAdminEditorORProgramAdminEditor')).toEqual({
			course: whereHasCoursePermission(USER, 'CourseAdminEditorORProgramAdminEditor')
		});
	});
});

describe('whereHasSandboxPermission', () => {
	it('Owner tier excludes the editor fragment', () => {
		expect(whereHasSandboxPermission(USER, 'Owner')).toEqual({
			OR: [{ ownerId: USER.id }]
		});
	});

	it('OwnerOREditor tier includes both owner and editor fragments', () => {
		expect(whereHasSandboxPermission(USER, 'OwnerOREditor')).toEqual({
			OR: [{ ownerId: USER.id }, { editors: { some: { id: USER.id } } }]
		});
	});

	it('has no super-admin bypass (option type does not offer OnlySuperAdmin)', () => {
		expect(whereHasSandboxPermission(ADMIN, 'Owner')).toEqual({
			OR: [{ ownerId: ADMIN.id }]
		});
	});
});
