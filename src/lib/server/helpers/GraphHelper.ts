import prisma from '$lib/server/prisma';

import type { SerializedGraph } from '$scripts/entities';
import type { Graph, Domain, Subject, Lecture } from '@prisma/client';

import { DomainHelper, SubjectHelper, LectureHelper } from '$lib/server/helpers';


export async function createWithCourseCode(courseCode: string, name: string) {
	await prisma.graph.create({
		data: {
			name,
			course: {
				connect: {
					code: courseCode
				}
			}
		}
	});
}


async function getDomains(graph: Graph): Promise<Domain[]> {
	return await prisma.domain.findMany({
		where: {
			graphId: graph.id
		},
		orderBy: {
			id: 'asc'
		}
	});
}


async function getSubjects(graph: Graph): Promise<Subject[]> {
	return await prisma.subject.findMany({
		where: {
			graphId: graph.id
		},
		orderBy: {
			id: 'asc'
		}
	});
}


async function getLectures(graph: Graph): Promise<Lecture[]> {
	return await prisma.lecture.findMany({
		where: {
			graphId: graph.id
		},
		orderBy: {
			id: 'asc'
		}
	});
}


export async function toDTO(graph: Graph): Promise<SerializedGraph> {
	return {
		id: graph.id,
		name: graph.name,
		domains: await Promise.all((await getDomains(graph)).map(d => DomainHelper.toDTO(d))),
		subjects: await Promise.all((await getSubjects(graph)).map(s => SubjectHelper.toDTO(s))),
		lectures: await Promise.all((await getLectures(graph)).map(l => LectureHelper.toDTO(l)))
	}
}


export async function updateFromDTO(dto: SerializedGraph): Promise<void> {
	await Promise.all([
		...dto.domains.map(d => DomainHelper.updateFromDTO(d)),
		...dto.subjects.map(s => SubjectHelper.updateFromDTO(s)),
		...dto.lectures.map(l => LectureHelper.updateFromDTO(l))
	]);

	await prisma.graph.update({
		where: {
			id: dto.id
		},
		data: {
			name: dto.name,
			domains: {
				connect: dto.domains.map(d => ({ id: d.id }))
			},
			subjects: {
				connect: dto.subjects.map(s => ({ id: s.id }))
			},
			lectures: {
				connect: dto.lectures.map(l => ({ id: l.id }))
			}
		}
	});
}
