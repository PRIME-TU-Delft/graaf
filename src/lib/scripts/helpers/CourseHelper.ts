// External dependencies
import prisma from '$lib/server/prisma';
import type { Course as PrismaCourse } from '@prisma/client';

// Internal dependencies
import { prismaUpdateArray } from '$scripts/utility';

import { ProgramHelper, GraphHelper, LinkHelper, UserHelper } from '$scripts/helpers';

import type {
	ProgramRelation,
	CourseRelation,
	GraphRelation,
	LinkRelation,
	UserRelation
} from '$scripts/types';

import type {
	SerializedProgram,
	SerializedCourse,
	SerializedGraph,
	SerializedLink,
	SerializedUser
} from '$scripts/types';

// --------------------> Helper Functions

export async function reduce(
	course: PrismaCourse,
	...relations: CourseRelation[]
): Promise<SerializedCourse> {
	const serialized: SerializedCourse = {
		id: course.id,
		unchanged: course.unchanged,
		code: course.code,
		name: course.name
	};

	// Fetch relations from database
	try {
		var data = await prisma.course.findUniqueOrThrow({
			where: {
				id: course.id
			},
			select: {
				programs: {
					select: {
						id: true
					}
				},
				graphs: {
					select: {
						id: true
					}
				},
				links: {
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
	if (relations.includes('programs'))
		serialized.program_ids = data.programs.map((program) => program.id);
	if (relations.includes('graphs')) serialized.graph_ids = data.graphs.map((graph) => graph.id);
	if (relations.includes('links')) serialized.link_ids = data.links.map((link) => link.id);
	if (relations.includes('editors'))
		serialized.editor_ids = data.editors.map((editor) => editor.id);
	if (relations.includes('admins')) serialized.admin_ids = data.admins.map((admin) => admin.id);

	return serialized;
}

export async function create(
	code: string,
	name: string,
	program_id?: number
): Promise<SerializedCourse> {
	const program_delta = prismaUpdateArray<number, SerializedProgram>(
		[],
		program_id ? [program_id] : []
	);

	try {
		var course = await prisma.course.create({
			data: {
				code,
				name,
				programs: program_delta
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await reduce(course, 'programs', 'graphs', 'links', 'editors', 'admins');
}

export async function update(data: SerializedCourse) {
	// Get deltas
	const [programs, graphs, links, editors, admins] = await Promise.all([
		getPrograms(data.id),
		getGraphs(data.id),
		getLinks(data.id),
		getEditors(data.id),
		getAdmins(data.id)
	]);

	const program_delta = prismaUpdateArray<number, SerializedProgram>(programs, data.program_ids);
	const graph_delta = prismaUpdateArray<number, SerializedGraph>(graphs, data.graph_ids);
	const link_delta = prismaUpdateArray<number, SerializedLink>(links, data.link_ids);
	const editor_delta = prismaUpdateArray<string, SerializedUser>(editors, data.editor_ids);
	const admin_delta = prismaUpdateArray<string, SerializedUser>(admins, data.admin_ids);

	// Update database
	try {
		await prisma.course.update({
			where: {
				id: data.id
			},
			data: {
				unchanged: data.unchanged,
				name: data.name,
				code: data.code,
				programs: program_delta,
				graphs: graph_delta,
				links: link_delta,
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
		await prisma.course.delete({
			where: {
				id
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}
}

export async function getAll(...relations: CourseRelation[]): Promise<SerializedCourse[]> {
	try {
		var courses = await prisma.course.findMany();
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(courses.map(async (course) => await reduce(course, ...relations)));
}

export async function getById(
	id: number,
	...relations: CourseRelation[]
): Promise<SerializedCourse> {
	try {
		var course = await prisma.course.findUniqueOrThrow({
			where: {
				id
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await reduce(course, ...relations);
}

export async function getPrograms(
	id: number,
	...relations: ProgramRelation[]
): Promise<SerializedProgram[]> {
	try {
		var data = await prisma.course.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				programs: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(
		data.programs.map(async (program) => await ProgramHelper.reduce(program, ...relations))
	);
}

export async function getGraphs(
	id: number,
	...relations: GraphRelation[]
): Promise<SerializedGraph[]> {
	try {
		var data = await prisma.course.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				graphs: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(
		data.graphs.map(async (graph) => await GraphHelper.reduce(graph, ...relations))
	);
}

export async function getLinks(
	id: number,
	...relations: LinkRelation[]
): Promise<SerializedLink[]> {
	try {
		var data = await prisma.course.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				links: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(
		data.links.map(async (link) => await LinkHelper.reduce(link, ...relations))
	);
}

export async function getEditors(
	id: number,
	...relations: UserRelation[]
): Promise<SerializedUser[]> {
	try {
		var data = await prisma.course.findUniqueOrThrow({
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
		var data = await prisma.course.findUniqueOrThrow({
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
