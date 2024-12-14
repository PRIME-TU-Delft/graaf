
// Internal dependencies
import { customError } from '$scripts/utility'

import {
	UserController,
	ProgramController,
	CourseController,
	GraphController,
	DomainController,
	SubjectController,
	LectureController,
	LinkController
} from '$scripts/controllers'

// Exports
export { ControllerCache }


// --------------------> Controller Cache


class ControllerCache {
	private users: UserController[] = []
	private programs: ProgramController[] = []
	private courses: CourseController[] = []
	private graphs: GraphController[] = []
	private domains: DomainController[] = []
	private subjects: SubjectController[] = []
	private lectures: LectureController[] = []
	private links: LinkController[] = []

	all(type: typeof UserController): UserController[]
	all(type: typeof ProgramController): ProgramController[]
	all(type: typeof CourseController): CourseController[]
	all(type: typeof GraphController): GraphController[]
	all(type: typeof DomainController): DomainController[]
	all(type: typeof SubjectController): SubjectController[]
	all(type: typeof LectureController): LectureController[]
	all(type: typeof LinkController): LinkController[]
	all(type: any): any[] {
		if (type === UserController) {
			return this.users
		} else if (type === ProgramController) {
			return this.programs
		} else if (type === CourseController) {
			return this.courses
		} else if (type === GraphController) {
			return this.graphs
		} else if (type === DomainController) {
			return this.domains
		} else if (type === SubjectController) {
			return this.subjects
		} else if (type === LectureController) {
			return this.lectures
		} else if (type === LinkController) {
			return this.links
		} else {
			throw customError('CacheError', `Invalid object type ${type}`)
		}
	}

	findOrThrow(type: typeof ProgramController, id: number): ProgramController
	findOrThrow(type: typeof CourseController, id: number): CourseController
	findOrThrow(type: typeof GraphController, id: number): GraphController
	findOrThrow(type: typeof DomainController, id: number): DomainController
	findOrThrow(type: typeof SubjectController, id: number): SubjectController
	findOrThrow(type: typeof LectureController, id: number): LectureController
	findOrThrow(type: typeof LinkController, id: number): LinkController
	findOrThrow(type: typeof UserController, id: string): UserController
	findOrThrow(type: any, id: any): any {
		const object = this.find(type, id)
		if (object === undefined)
			throw customError('CacheMiss', `${type.name} with ID ${id} not found`)
		return object
	}

	find(type: typeof UserController, id: string): UserController | undefined
	find(type: typeof ProgramController, id: number): ProgramController | undefined
	find(type: typeof CourseController, id: number): CourseController | undefined
	find(type: typeof GraphController, id: number): GraphController | undefined
	find(type: typeof DomainController, id: number): DomainController | undefined
	find(type: typeof SubjectController, id: number): SubjectController | undefined
	find(type: typeof LectureController, id: number): LectureController | undefined
	find(type: typeof LinkController, id: number): LinkController | undefined
	find(type: any, id: any): any {
		if (type === UserController) {
			return this.users.find(user => user.id === id)
		} else if (type === ProgramController) {
			return this.programs.find(program => program.id === id)
		} else if (type === CourseController) {
			return this.courses.find(course => course.id === id)
		} else if (type === GraphController) {
			return this.graphs.find(graph => graph.id === id)
		} else if (type === DomainController) {
			return this.domains.find(domain => domain.id === id)
		} else if (type === SubjectController) {
			return this.subjects.find(subject => subject.id === id)
		} else if (type === LectureController) {
			return this.lectures.find(lecture => lecture.id === id)
		} else if (type === LinkController) {
			return this.links.find(link => link.id === id)
		} else {
			throw customError('CacheError', `Invalid object type ${type}`)
		}
	}

	add(object: UserController): void
	add(object: ProgramController): void
	add(object: CourseController): void
	add(object: GraphController): void
	add(object: DomainController): void
	add(object: SubjectController): void
	add(object: LectureController): void
	add(object: LinkController): void
	add(object: any): void {
		if (object instanceof UserController) {
			if (this.users.find(user => user.id === object.id))
				throw customError('CacheHit', `User with ID ${object.id} already exists`)
			this.users.push(object)
		} else if (object instanceof ProgramController) {
			if (this.programs.find(program => program.id === object.id))
				throw customError('CacheHit', `Program with ID ${object.id} already exists`)
			this.programs.push(object)
		} else if (object instanceof CourseController) {
			if (this.courses.find(course => course.id === object.id))
				throw customError('CacheHit', `Course with ID ${object.id} already exists`)
			this.courses.push(object)
		} else if (object instanceof GraphController) {
			if (this.graphs.find(graph => graph.id === object.id))
				throw customError('CacheHit', `Graph with ID ${object.id} already exists`)
			this.graphs.push(object)
		} else if (object instanceof DomainController) {
			if (this.domains.find(domain => domain.id === object.id))
				throw customError('CacheHit', `Domain with ID ${object.id} already exists`)
			this.domains.push(object)
		} else if (object instanceof SubjectController) {
			if (this.subjects.find(subject => subject.id === object.id))
				throw customError('CacheHit', `Subject with ID ${object.id} already exists`)
			this.subjects.push(object)
		} else if (object instanceof LectureController) {
			if (this.lectures.find(lecture => lecture.id === object.id))
				throw customError('CacheHit', `Lecture with ID ${object.id} already exists`)
			this.lectures.push(object)
		} else if (object instanceof LinkController) {
			if (this.links.find(link => link.id === object.id))
				throw customError('CacheHit', `Link with ID ${object.id} already exists`)
			this.links.push(object)
		} else {
			throw customError('CacheError', `Invalid object type ${object.constructor}`)
		}
	}

	remove(object: UserController): void
	remove(object: ProgramController): void
	remove(object: CourseController): void
	remove(object: GraphController): void
	remove(object: DomainController): void
	remove(object: SubjectController): void
	remove(object: LectureController): void
	remove(object: LinkController): void
	remove(object: any): void {
		if (object instanceof UserController) {
			if (!this.users.find(user => user.id === object.id))
				throw customError('CacheMiss', `User with ID ${object.id} not found`)
			this.users = this.users.filter(user => user.id !== object.id)
		} else if (object instanceof ProgramController) {
			if (!this.programs.find(program => program.id === object.id))
				throw customError('CacheMiss', `Program with ID ${object.id} not found`)
			this.programs = this.programs.filter(program => program.id !== object.id)
		} else if (object instanceof CourseController) {
			if (!this.courses.find(course => course.id === object.id))
				throw customError('CacheMiss', `Course with ID ${object.id} not found`)
			this.courses = this.courses.filter(course => course.id !== object.id)
		} else if (object instanceof GraphController) {
			if (!this.graphs.find(graph => graph.id === object.id))
				throw customError('CacheMiss', `Graph with ID ${object.id} not found`)
			this.graphs = this.graphs.filter(graph => graph.id !== object.id)
		} else if (object instanceof DomainController) {
			if (!this.domains.find(domain => domain.id === object.id))
				throw customError('CacheMiss', `Domain with ID ${object.id} not found`)
			this.domains = this.domains.filter(domain => domain.id !== object.id)
		} else if (object instanceof SubjectController) {
			if (!this.subjects.find(subject => subject.id === object.id))
				throw customError('CacheMiss', `Subject with ID ${object.id} not found`)
			this.subjects = this.subjects.filter(subject => subject.id !== object.id)
		} else if (object instanceof LectureController) {
			if (!this.lectures.find(lecture => lecture.id === object.id))
				throw customError('CacheMiss', `Lecture with ID ${object.id} not found`)
			this.lectures = this.lectures.filter(lecture => lecture.id !== object.id)
		} else if (object instanceof LinkController) {
			if (!this.links.find(link => link.id === object.id))
				throw customError('CacheMiss', `Link with ID ${object.id} not found`)
			this.links = this.links.filter(link => link.id !== object.id)
		} else {
			throw customError('CacheError', `Invalid object type ${object.constructor}`)
		}
	}
}