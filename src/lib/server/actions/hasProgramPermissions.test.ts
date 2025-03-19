import { describe, expect, test } from 'vitest';
import { whereHasProgramPermission } from './Programs';
import { regularUser, superAdminUser } from './tests/helpers/test-users';

describe('hasProgramPermissions', () => {
	test('is empty object when superAdmin', () => {
		const res = whereHasProgramPermission(superAdminUser, 'OnlySuperAdmin');

		expect(res).toEqual({});
	});

	test('throw error when not a superAdmin', () => {
		expect(() => whereHasProgramPermission(regularUser, 'OnlySuperAdmin')).toThrowError();
	});

	test('has admin permission', () => {
		const res = whereHasProgramPermission(regularUser, 'ProgramAdmin');

		expect(res).toEqual({ OR: [{ admins: { some: { id: regularUser.id } } }] });
	});

	test('has both admin or editor permission', () => {
		const res = whereHasProgramPermission(regularUser, 'ProgramAdminEditor');

		expect(res).toEqual({
			OR: [
				{ admins: { some: { id: regularUser.id } } },
				{ editors: { some: { id: regularUser.id } } }
			]
		});
	});
});
