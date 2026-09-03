import { describe, expect, it } from 'vitest';
import { matchesUserSearch } from './userSearch';
import type { DataUser } from './userTableColumns';

function makeUser(partial: Partial<DataUser> = {}) {
	return {
		id: 'u1',
		role: 'USER',
		nickname: null,
		firstName: null,
		lastName: null,
		email: 'ada.lovelace@tudelft.nl',
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

describe('matchesUserSearch', () => {
	it('keeps every user when the search box is empty or blank', () => {
		const user = makeUser();

		expect(matchesUserSearch(user, '')).toBe(true);
		expect(matchesUserSearch(user, '   ')).toBe(true);
		expect(matchesUserSearch(user, undefined)).toBe(true);
	});

	it('matches on the nickname shown in the table', () => {
		const user = makeUser({ nickname: 'Ada' });

		expect(matchesUserSearch(user, 'ada')).toBe(true);
		expect(matchesUserSearch(user, 'ADA')).toBe(true);
		expect(matchesUserSearch(user, 'Grace')).toBe(false);
	});

	it('matches on first and last name when there is no nickname', () => {
		const user = makeUser({ firstName: 'Grace', lastName: 'Hopper' });

		expect(matchesUserSearch(user, 'grace')).toBe(true);
		expect(matchesUserSearch(user, 'hopper')).toBe(true);
		expect(matchesUserSearch(user, 'grace hopper')).toBe(true);
	});

	it('matches on the email address', () => {
		const user = makeUser({ nickname: 'Ada', email: 'a.lovelace@tudelft.nl' });

		expect(matchesUserSearch(user, 'lovelace')).toBe(true);
		expect(matchesUserSearch(user, 'TUDELFT.NL')).toBe(true);
		expect(matchesUserSearch(user, 'example.com')).toBe(false);
	});

	it('ignores surrounding whitespace in the needle', () => {
		const user = makeUser({ nickname: 'Ada' });

		expect(matchesUserSearch(user, '  ada  ')).toBe(true);
	});

	it('rejects a user that matches neither name nor email', () => {
		const user = makeUser({ nickname: 'Ada', email: 'a.lovelace@tudelft.nl' });

		expect(matchesUserSearch(user, 'zzz')).toBe(false);
	});
});
