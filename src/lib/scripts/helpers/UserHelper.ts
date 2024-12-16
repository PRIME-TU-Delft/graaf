// External dependencies
import prisma from '$lib/server/prisma';
import type { User as PrismaUser } from '@prisma/client';

// Internal dependencies
import { prismaUpdateArray } from '$scripts/utility';

import { ProgramHelper, CourseHelper } from '$scripts/helpers';

import type { ProgramRelation, CourseRelation, UserRelation } from '$scripts/types';

import type { SerializedProgram, SerializedCourse, SerializedUser } from '$scripts/types';

// --------------------> Helper Functions

export async function reduce(
	user: PrismaUser,
	...relations: UserRelation[]
): Promise<SerializedUser> {
	const serialized: SerializedUser = {
		id: user.id,
		role: user.role,
		first_name: user.firstName,
		last_name: user.lastName,
		email: user.email
	};

	// Fetch relations from database
	try {
		var data = await prisma.user.findUniqueOrThrow({
			where: {
				id: user.id
			},
			select: {
				program_editors: {
					select: {
						id: true
					}
				},
				program_admins: {
					select: {
						id: true
					}
				},
				course_editors: {
					select: {
						id: true
					}
				},
				course_admins: {
					select: {
						id: true
					}
				}
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	// Add relations if requested
	if (relations.includes('program_editors'))
		serialized.program_editor_ids = data.program_editors.map((program) => program.id);
	if (relations.includes('program_admins'))
		serialized.program_admin_ids = data.program_admins.map((program) => program.id);
	if (relations.includes('course_editors'))
		serialized.course_editor_ids = data.course_editors.map((course) => course.id);
	if (relations.includes('course_admins'))
		serialized.course_admin_ids = data.course_admins.map((course) => course.id);

	return serialized;
}

export async function getAll(...relations: UserRelation[]): Promise<SerializedUser[]> {
	try {
		var users = await prisma.user.findMany();
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(users.map(async (user) => await reduce(user, ...relations)));
}

export async function getById(id: string, ...relations: UserRelation[]): Promise<SerializedUser> {
	try {
		var user = await prisma.user.findUniqueOrThrow({
			where: {
				id
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await reduce(user, ...relations);
}

export async function getProgramEditors(
	id: string,
	...relations: ProgramRelation[]
): Promise<SerializedProgram[]> {
	try {
		var data = await prisma.user.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				program_editors: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(
		data.program_editors.map((editor) => ProgramHelper.reduce(editor, ...relations))
	);
}

export async function getProgramAdmins(
	id: string,
	...relations: ProgramRelation[]
): Promise<SerializedProgram[]> {
	try {
		var data = await prisma.user.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				program_admins: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(
		data.program_admins.map((admin) => ProgramHelper.reduce(admin, ...relations))
	);
}

export async function getCourseEditors(
	id: string,
	...relations: CourseRelation[]
): Promise<SerializedCourse[]> {
	try {
		var data = await prisma.user.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				course_editors: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(
		data.course_editors.map((editor) => CourseHelper.reduce(editor, ...relations))
	);
}

export async function getCourseAdmins(
	id: string,
	...relations: CourseRelation[]
): Promise<SerializedCourse[]> {
	try {
		var data = await prisma.user.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				course_admins: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(
		data.course_admins.map((admin) => CourseHelper.reduce(admin, ...relations))
	);
}
