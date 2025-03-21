import { describe, expect, test } from 'vitest';
import { whereHasCoursePermission } from '../permissions';
import { regularUser, superAdminUser } from './tests/helpers/test-users';

describe('hasProgramPermissions', () => {
	test('is empty object when superAdmin', () => {
		const res = whereHasCoursePermission(superAdminUser, 'OnlySuperAdmin');

		expect(res).toEqual({});
	});

	test('throw error when not a superAdmin', () => {
		expect(() => whereHasCoursePermission(regularUser, 'OnlySuperAdmin')).toThrowError();
	});

	test('has program admin permission', () => {
		const res = whereHasCoursePermission(regularUser, 'ProgramAdmin');

		expect(res).toEqual({
			OR: [{ programs: { some: { admins: { some: { id: regularUser.id } } } } }]
		});
	});

	test('has program editor permission', () => {
		const res = whereHasCoursePermission(regularUser, 'ProgramAdminEditor');

		expect(res).toEqual({
			OR: [
				{ programs: { some: { admins: { some: { id: regularUser.id } } } } },
				{ programs: { some: { editors: { some: { id: regularUser.id } } } } }
			]
		});
	});

	test('has course admin or program editor permission', () => {
		const res = whereHasCoursePermission(regularUser, 'CourseAdminORProgramAdminEditor');

		expect(res).toEqual({
			OR: [
				{ programs: { some: { admins: { some: { id: regularUser.id } } } } },
				{ programs: { some: { editors: { some: { id: regularUser.id } } } } },
				{ admins: { some: { id: regularUser.id } } }
			]
		});
	});

	test('has course editor permission', () => {
		const res = whereHasCoursePermission(regularUser, 'CourseAdminEditorORProgramAdminEditor');

		expect(res).toEqual({
			OR: [
				{ programs: { some: { admins: { some: { id: regularUser.id } } } } },
				{ programs: { some: { editors: { some: { id: regularUser.id } } } } },
				{ admins: { some: { id: regularUser.id } } },
				{ editors: { some: { id: regularUser.id } } }
			]
		});
	});
});
