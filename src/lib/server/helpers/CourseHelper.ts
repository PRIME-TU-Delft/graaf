import prisma from '$lib/server/prisma';

import { type SerializedCourse, type SerializedAssignedUser, Permissions } from '$scripts/entities';
import type { Course } from '@prisma/client';


export async function create(code: string, name: string, programId: number) {
	await prisma.course.create({
		data: {
			code,
			name,
			program: {
				connect: {
					id: programId
				}
			}
		}
	});
}


async function getSerializedUsers(course: Course): Promise<SerializedAssignedUser[]> {
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
		},
		orderBy: {
			id: 'asc'
		}
	}));
	return user.map(u => ({
		id: u.id,
		netid: u.netid,
		first_name: u.first_name,
		last_name: u.last_name,
		email: u.email ?? undefined,
		permissions: Permissions.admin  // TODO: join table for course-user permissions
	}));
}


export async function toDTO(course: Course): Promise<SerializedCourse> {
	return {
		code: course.code,
		name: course.name,
		users: await getSerializedUsers(course)
	}
}
