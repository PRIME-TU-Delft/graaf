import prisma from '$lib/server/db/prisma.js';

// This is to test the connection to the database
// If the connection is successful, it will return the first program in the database
// Otherwise, it will throw an error
export const load = async () => {
	return {
		testConnection: prisma.program.findFirst()
	};
};
