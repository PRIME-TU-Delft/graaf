
// External dependencies
import { writable } from 'svelte/store'

// Internal dependencies
import {
	type ControllerCache,
	type CourseController,
	type GraphController,
	type DomainController,
	type SubjectController,
	type LectureController,
	type DomainRelationController,
	type SubjectRelationController
} from '$scripts/controllers'

// Exports
export const cache = writable<ControllerCache | undefined>()
export const course = writable<CourseController | undefined>()
export const graph = writable<GraphController | undefined>()
export const domains = writable<DomainController[] | undefined>()
export const domain_relations = writable<DomainRelationController[] | undefined>()
export const subjects = writable<SubjectController[] | undefined>()
export const subject_relations = writable<SubjectRelationController[] | undefined>()
export const lectures = writable<LectureController[] | undefined>()

graph.subscribe(async graph => course.set(await graph?.getCourse()))
graph.subscribe(async graph => domains.set(await graph?.getDomains()))
graph.subscribe(async graph => domain_relations.set(await graph?.getDomainRelations()))
graph.subscribe(async graph => subjects.set(await graph?.getSubjects()))
graph.subscribe(async graph => subject_relations.set(await graph?.getSubjectRelations()))
graph.subscribe(async graph => lectures.set(await graph?.getLectures()))
