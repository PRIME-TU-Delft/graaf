// External dependencies
import prisma from '$lib/server/prisma';
import type { Program as PrismaProgram } from '@prisma/client';

// Internal dependencies
import { prismaUpdateArray } from '$scripts/utility';

import { CourseHelper, UserHelper } from '$scripts/helpers';

import type { ProgramRelation, CourseRelation, UserRelation } from '$scripts/types';

import type { SerializedProgram, SerializedCourse, SerializedUser } from '$scripts/types';

// --------------------> Helper Functions

export async function reduce(
	program: PrismaProgram,
	...relations: ProgramRelation[]
): Promise<SerializedProgram> {
	const serialized: SerializedProgram = {
		id: program.id,
		unchanged: program.unchanged,
		name: program.name
	};

	// Fetch relations from database
	try {
		var data = await prisma.program.findUniqueOrThrow({
			where: {
				id: program.id
			},
			select: {
				courses: {
					select: {
						id: true
					}
				},
				editors: {
					select: {
						id: true
					}
				},
				admins: {
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
	if (relations.includes('courses'))
		serialized.course_ids = data.courses.map((course) => course.id);
	if (relations.includes('editors'))
		serialized.editor_ids = data.editors.map((editor) => editor.id);
	if (relations.includes('admins')) serialized.admin_ids = data.admins.map((admin) => admin.id);

	return serialized;
}

export async function create(name: string): Promise<SerializedProgram> {
	try {
		var program = await prisma.program.create({
			data: {
				name
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await reduce(program, 'courses', 'editors', 'admins');
}

export async function update(data: SerializedProgram) {
	// Get deltas
	const [courses, editors, admins] = await Promise.all([
		getCourses(data.id),
		getEditors(data.id),
		getAdmins(data.id)
	]);

	const course_delta = prismaUpdateArray<number, SerializedCourse>(courses, data.course_ids);
	const editor_delta = prismaUpdateArray<string, SerializedUser>(editors, data.editor_ids);
	const admin_delta = prismaUpdateArray<string, SerializedUser>(admins, data.admin_ids);

	// Update database
	try {
		await prisma.program.update({
			where: {
				id: data.id
			},
			data: {
				unchanged: data.unchanged,
				name: data.name,
				courses: course_delta,
				editors: editor_delta,
				admins: admin_delta
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}
}

export async function remove(id: number) {
	try {
		await prisma.program.delete({
			where: {
				id
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}
}

export async function getAll(...relations: ProgramRelation[]): Promise<SerializedProgram[]> {
	try {
		var programs = await prisma.program.findMany();
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(programs.map(async (program) => await reduce(program, ...relations)));
}

export async function getById(
	id: number,
	...relations: ProgramRelation[]
): Promise<SerializedProgram> {
	try {
		var program = await prisma.program.findUniqueOrThrow({
			where: {
				id
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await reduce(program, ...relations);
}

export async function getCourses(
	id: number,
	...relations: CourseRelation[]
): Promise<SerializedCourse[]> {
	try {
		var data = await prisma.program.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				courses: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(
		data.courses.map(async (course) => await CourseHelper.reduce(course, ...relations))
	);
}

export async function getEditors(
	id: number,
	...relations: UserRelation[]
): Promise<SerializedUser[]> {
	try {
		var data = await prisma.program.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				editors: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(
		data.editors.map(async (editor) => await UserHelper.reduce(editor, ...relations))
	);
}

export async function getAdmins(
	id: number,
	...relations: UserRelation[]
): Promise<SerializedUser[]> {
	try {
		var data = await prisma.program.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				admins: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(
		data.admins.map(async (admin) => await UserHelper.reduce(admin, ...relations))
	);
}
