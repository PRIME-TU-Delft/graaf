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
		}
	});
}


async function getSubjects(graph: Graph): Promise<Subject[]> {
	return await prisma.subject.findMany({
		where: {
			graphId: graph.id
		}
	});
}


async function getLectures(graph: Graph): Promise<Lecture[]> {
	return await prisma.lecture.findMany({
		where: {
			graphId: graph.id
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
