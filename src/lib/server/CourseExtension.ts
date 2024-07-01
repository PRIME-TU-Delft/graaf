import prisma from '$lib/server/prisma';

import type { SerializedCourse, SerializedAssignedUser } from '$scripts/entities';
import type { Course } from '@prisma/client';


const getSerializedUsers = {
	needs: { id: true },
	async compute(course: Course): Promise<SerializedAssignedUser[]> {
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
}


/***
 * Converts a Course object to a SerializedCourse object, which can be sent to the client.
 * @param course plain Course object
 * @returns SerializedCourse object
 */
const dto = {
	needs: {
		id: true,
		code: true,
		name: true
	},
	async compute(course: Course): Promise<SerializedCourse> {
		return {
			code: course.code,
			name: course.name,
			users: await getSerializedUsers.compute(course)
		}
	}
}


export default {
	result: {
		course: {
			dto,
		}
	}
}
