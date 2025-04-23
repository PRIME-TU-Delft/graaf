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
			}
		});

		return {
			users: allUsers,
			user
		};
	} catch {
		throw redirect(303, '/');
	}
};
