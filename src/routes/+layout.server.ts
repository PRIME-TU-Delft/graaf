import type { User } from '@prisma/client';
import { redirect } from '@sveltejs/kit';

// This is to test the connection to the database
// If the connection is successful, it will return the first program in the database
// Otherwise, it will throw an error

export const load = async ({ locals, url }) => {
	const session = await locals.auth();

	if (!session?.user && !url.pathname.startsWith('/auth')) redirect(303, '/auth');

	return {
		session,
		user: session?.user as User | undefined
	};
};
