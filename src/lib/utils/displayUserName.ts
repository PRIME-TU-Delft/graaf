import type { User } from '@prisma/client';

export function displayName(user?: User, fallback: string = 'No user') {
	if (!user) return fallback;

	return user.nickname || user.firstName + ' ' + user.lastName || user.email;
}
