import prisma from '$lib/server/db/prisma.js';
import { redirect } from '@sveltejs/kit';

// This is to test the connection to the database
// If the connection is successful, it will return the first program in the database
// Otherwise, it will throw an error
export const load = async ({ locals, url }) => {
	const session = await locals.auth();

	return {
		testConnection: prisma.program.findFirst()
	};
};
