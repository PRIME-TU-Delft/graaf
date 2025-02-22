import type { User } from '@prisma/client';

export const superAdminUser: User = {
	id: '1',
	role: 'ADMIN',
	nickname: 'test-admin',
	firstName: 'Test',
	lastName: 'Admin',
	email: 'admin@user.com',
	emailVerified: null,
	image: null,
	createdAt: new Date('2022-01-20T00:00:00.000Z'),
	updatedAt: new Date('2023-02-21T00:00:00.000Z')
};

// TODO: Add program admin user
// TODO: Add program editor user
// TODO: Add course admin user
// TODO: Add course editor user

export const regularUser: User = {
	id: '2',
	role: 'USER',
	nickname: 'test-user',
	firstName: 'Test',
	lastName: 'User',
	email: 'test@user.com',
	emailVerified: null,
	image: null,
	createdAt: new Date('2024-01-20T00:00:00.000Z'),
	updatedAt: new Date('2025-02-21T00:00:00.000Z')
};
