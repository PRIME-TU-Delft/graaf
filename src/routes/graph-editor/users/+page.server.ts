import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const user = await getUser({ locals });

	// If not a super admin, redirect to home
	if (user?.role != 'ADMIN') {
		throw redirect(303, '/');
	}

	try {
		const allUsers = await prisma.user.findMany({
			include: {
				course_admins: true,
				course_editors: true,
				program_admins: true,
				program_editors: true
			},
			orderBy: {
				role: 'desc' // ADMIN first then USER
			}
		});

		return {
			// Make sure the logged-in user is always first in the list
			users: allUsers.toSorted((a, b) => {
				if (a.id === user.id) return -1;
				if (b.id === user.id) return 1;
				return 0;
			}),
			user
		};
	} catch {
		throw redirect(303, '/');
	}
};
