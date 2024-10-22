
// Internal dependencies
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


// --------------------> Cache


class ControllerCache {
	private users: UserController[] = []
	private programs: ProgramController[] = []
	private courses: CourseController[] = []
	private graphs: GraphController[] = []
	private domains: DomainController[] = []
	private subjects: SubjectController[] = []
	private lectures: LectureController[] = []
	private links: LinkController[] = []

	/**
	 * Finds an object in the cache
	 * @param type The type of the object
	 * @param id The ID of the object
	 * @returns The found object, or `undefined` if not found
	 * @throws `CacheError` If the object type is invalid
	 */

	find(type: typeof UserController, id: number): UserController | undefined
	find(type: typeof ProgramController, id: number): ProgramController | undefined
	find(type: typeof CourseController, id: number): CourseController | undefined
	find(type: typeof GraphController, id: number): GraphController | undefined
	find(type: typeof DomainController, id: number): DomainController | undefined
	find(type: typeof SubjectController, id: number): SubjectController | undefined
	find(type: typeof LectureController, id: number): LectureController | undefined
	find(type: typeof LinkController, id: number): LinkController | undefined
	find(type: any, id: number): any {
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
			throw new Error(`CacheError: Invalid object type: ${type}`)
		}
	}

	/**
	 * Adds objects to the cache
	 * @param object The object to be added
	 * @throws `CacheError` If the object already exists in the cache or if the object type is invalid
	 */

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
			if (this.users.some(user => user.id === object.id))
				throw new Error(`CacheError: User with ID ${object.id} already exists`)
			this.users.push(object)
		} else if (object instanceof ProgramController) {
			if (this.programs.some(program => program.id === object.id))
				throw new Error(`CacheError: Program with ID ${object.id} already exists`)
			this.programs.push(object)
		} else if (object instanceof CourseController) {
			if (this.courses.some(course => course.id === object.id))
				throw new Error(`CacheError: Course with ID ${object.id} already exists`)
			this.courses.push(object)
		} else if (object instanceof GraphController) {
			if (this.graphs.some(graph => graph.id === object.id))
				throw new Error(`CacheError: Graph with ID ${object.id} already exists`)
			this.graphs.push(object)
		} else if (object instanceof DomainController) {
			if (this.domains.some(domain => domain.id === object.id))
				throw new Error(`CacheError: Domain with ID ${object.id} already exists`)
			this.domains.push(object)
		} else if (object instanceof SubjectController) {
			if (this.subjects.some(subject => subject.id === object.id))
				throw new Error(`CacheError: Subject with ID ${object.id} already exists`)
			this.subjects.push(object)
		} else if (object instanceof LectureController) {
			if (this.lectures.some(lecture => lecture.id === object.id))
				throw new Error(`CacheError: Lecture with ID ${object.id} already exists`)
			this.lectures.push(object)
		} else if (object instanceof LinkController) {
			if (this.links.some(link => link.id === object.id))
				throw new Error(`CacheError: Link with ID ${object.id} already exists`)
			this.links.push(object)
		} else {
			throw new Error(`CacheError: Invalid object type: ${object}`)
		}
	}

	/**
	 * Removes objects from the cache
	 * @param object The object to be removed
	 * @throws `CacheError` If the object does not exist in the cache or if the object type is invalid
	 */

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
			if (!this.users.some(user => user.id === object.id))
				throw new Error(`CacheError: User with ID ${object.id} does not exist`)
			this.users = this.users.filter(user => user.id !== object.id)
		} else if (object instanceof ProgramController) {
			if (!this.programs.some(program => program.id === object.id))
				throw new Error(`CacheError: Program with ID ${object.id} does not exist`)
			this.programs = this.programs.filter(program => program.id !== object.id)
		} else if (object instanceof CourseController) {
			if (!this.courses.some(course => course.id === object.id))
				throw new Error(`CacheError: Course with ID ${object.id} does not exist`)
			this.courses = this.courses.filter(course => course.id !== object.id)
		} else if (object instanceof GraphController) {
			if (!this.graphs.some(graph => graph.id === object.id))
				throw new Error(`CacheError: Graph with ID ${object.id} does not exist`)
			this.graphs = this.graphs.filter(graph => graph.id !== object.id)
		} else if (object instanceof DomainController) {
			if (!this.domains.some(domain => domain.id === object.id))
				throw new Error(`CacheError: Domain with ID ${object.id} does not exist`)
			this.domains = this.domains.filter(domain => domain.id !== object.id)
		} else if (object instanceof SubjectController) {
			if (!this.subjects.some(subject => subject.id === object.id))
				throw new Error(`CacheError: Subject with ID ${object.id} does not exist`)
			this.subjects = this.subjects.filter(subject => subject.id !== object.id)
		} else if (object instanceof LectureController) {
			if (!this.lectures.some(lecture => lecture.id === object.id))
				throw new Error(`CacheError: Lecture with ID ${object.id} does not exist`)
			this.lectures = this.lectures.filter(lecture => lecture.id !== object.id)
		} else if (object instanceof LinkController) {
			if (!this.links.some(link => link.id === object.id))
				throw new Error(`CacheError: Link with ID ${object.id} does not exist`)
			this.links = this.links.filter(link => link.id !== object.id)
		} else {
			throw new Error(`CacheError: Invalid object type: ${object}`)
		}
	}
}