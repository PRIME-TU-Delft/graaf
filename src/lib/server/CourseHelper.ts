import prisma from '$lib/server/prisma';

import type { SerializedCourse, SerializedAssignedUser } from '$scripts/entities';
import type { Course } from '@prisma/client';


async function getSerializedUser(course: Course) {
	const user = (await prisma.user.findMany({
		where: {
			programs: {
				some: {
					courses: {
						some: {
							id: course.id
						}
					}
				}
			}
		}
	}));
	return user.map(u => ({
		netid: u.netid,
		first_name: u.first_name,
		last_name: u.last_name,
		email: u.email ?? undefined,
		role: u.role as 'admin' | 'user'
	}));
}


export async function toDTO(course: Course): Promise<SerializedCourse> {
	return {
		code: course.code,
		name: course.name,
		users: await getSerializedUser(course)
	}
}
