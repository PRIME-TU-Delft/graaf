
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

import {
	instanceOfSerializedUser,
	instanceOfSerializedProgram,
	instanceOfSerializedCourse,
	instanceOfSerializedGraph,
	instanceOfSerializedDomain,
	instanceOfSerializedSubject,
	instanceOfSerializedLecture,
	instanceOfSerializedLink
} from '$scripts/types'

import type {
	SerializedUser,
	SerializedProgram,
	SerializedCourse,
	SerializedDomain,
	SerializedGraph,
	SerializedLecture,
	SerializedSubject,
	SerializedLink
} from '$scripts/types'

// Exports
export { ControllerEnvironment }


// --------------------> Environment


class ControllerEnvironment {
	users: UserController[] = []
	programs: ProgramController[] = []
	courses: CourseController[] = []
	graphs: GraphController[] = []
	domains: DomainController[] = []
	subjects: SubjectController[] = []
	lectures: LectureController[] = []
	links: LinkController[] = []

	/**
	 * Overloaded get method to get objects from the environment. If it doesn't exist, it will revive it
	 * @param data The data to get from the environment
	 * @returns The object from the environment
	 * @throws If the object type is invalid
	 */

	get(data: SerializedUser): UserController
	get(data: SerializedProgram): ProgramController
	get(data: SerializedCourse): CourseController
	get(data: SerializedGraph): GraphController
	get(data: SerializedDomain): DomainController
	get(data: SerializedSubject): SubjectController
	get(data: SerializedLecture): LectureController
	get(data: SerializedLink): LinkController
	get(data: any): any {
		if (instanceOfSerializedUser(data)) {
			let found = this.users.find(user => user.id === data.id)
			return found ? found : UserController.revive(this, data)
		} else if (instanceOfSerializedProgram(data)) {
			let found = this.programs.find(program => program.id === data.id)
			return found ? found : ProgramController.revive(this, data)
		} else if (instanceOfSerializedCourse(data)) {
			let found = this.courses.find(course => course.id === data.id)
			return found ? found : CourseController.revive(this, data)
		} else if (instanceOfSerializedGraph(data)) {
			let found = this.graphs.find(graph => graph.id === data.id)
			return found ? found : GraphController.revive(this, data)
		} else if (instanceOfSerializedDomain(data)) {
			let found = this.domains.find(domain => domain.id === data.id)
			return found ? found : DomainController.revive(this, data)
		} else if (instanceOfSerializedSubject(data)) {
			let found = this.subjects.find(subject => subject.id === data.id)
			return found ? found : SubjectController.revive(this, data)
		} else if (instanceOfSerializedLecture(data)) {
			let found = this.lectures.find(lecture => lecture.id === data.id)
			return found ? found : LectureController.revive(this, data)
		} else if (instanceOfSerializedLink(data)) {
			let found = this.links.find(link => link.id === data.id)
			return found ? found : LinkController.revive(this, data)
		} else {
			throw new Error(`EnvironmentError: Invalid object type: ${data}`)
		}
	}

	/**
	 * Overloaded remember method to add objects to the environment
	 * @param object The object to add to the environment
	 * @throws If the object already exists in the environment or if the object type is invalid
	 */

	remember(object: UserController): void
	remember(object: ProgramController): void
	remember(object: CourseController): void
	remember(object: GraphController): void
	remember(object: DomainController): void
	remember(object: SubjectController): void
	remember(object: LectureController): void
	remember(object: LinkController): void
	remember(object: any): void {
		if (object instanceof UserController) {
			if (this.users.some(user => user.id === object.id))
				throw new Error(`EnvironmentError: User with ID ${object.id} already exists`)
			this.users.push(object)
		} else if (object instanceof ProgramController) {
			if (this.programs.some(program => program.id === object.id))
				throw new Error(`EnvironmentError: Program with ID ${object.id} already exists`)
			this.programs.push(object)
		} else if (object instanceof CourseController) {
			if (this.courses.some(course => course.id === object.id))
				throw new Error(`EnvironmentError: Course with ID ${object.id} already exists`)
			this.courses.push(object)
		} else if (object instanceof GraphController) {
			if (this.graphs.some(graph => graph.id === object.id))
				throw new Error(`EnvironmentError: Graph with ID ${object.id} already exists`)
			this.graphs.push(object)
		} else if (object instanceof DomainController) {
			if (this.domains.some(domain => domain.id === object.id))
				throw new Error(`EnvironmentError: Domain with ID ${object.id} already exists`)
			this.domains.push(object)
		} else if (object instanceof SubjectController) {
			if (this.subjects.some(subject => subject.id === object.id))
				throw new Error(`EnvironmentError: Subject with ID ${object.id} already exists`)
			this.subjects.push(object)
		} else if (object instanceof LectureController) {
			if (this.lectures.some(lecture => lecture.id === object.id))
				throw new Error(`EnvironmentError: Lecture with ID ${object.id} already exists`)
			this.lectures.push(object)
		} else if (object instanceof LinkController) {
			if (this.links.some(link => link.id === object.id))
				throw new Error(`EnvironmentError: Link with ID ${object.id} already exists`)
			this.links.push(object)
		} else {
			throw new Error(`EnvironmentError: Invalid object type: ${object}`)
		}
	}

	/**
	 * Overloaded forget method to remove objects from the environment
	 * @param object The object to remove from the environment
	 * @throws If the object does not exist in the environment or if the object type is invalid
	 */

	forget(object: UserController): void
	forget(object: ProgramController): void
	forget(object: CourseController): void
	forget(object: GraphController): void
	forget(object: DomainController): void
	forget(object: SubjectController): void
	forget(object: LectureController): void
	forget(object: LinkController): void
	forget(object: any): void {
		if (object instanceof UserController) {
			if (!this.users.some(user => user.id === object.id))
				throw new Error(`EnvironmentError: User with ID ${object.id} does not exist`)
			this.users = this.users.filter(user => user.id !== object.id)
		} else if (object instanceof ProgramController) {
			if (!this.programs.some(program => program.id === object.id))
				throw new Error(`EnvironmentError: Program with ID ${object.id} does not exist`)
			this.programs = this.programs.filter(program => program.id !== object.id)
		} else if (object instanceof CourseController) {
			if (!this.courses.some(course => course.id === object.id))
				throw new Error(`EnvironmentError: Course with ID ${object.id} does not exist`)
			this.courses = this.courses.filter(course => course.id !== object.id)
		} else if (object instanceof GraphController) {
			if (!this.graphs.some(graph => graph.id === object.id))
				throw new Error(`EnvironmentError: Graph with ID ${object.id} does not exist`)
			this.graphs = this.graphs.filter(graph => graph.id !== object.id)
		} else if (object instanceof DomainController) {
			if (!this.domains.some(domain => domain.id === object.id))
				throw new Error(`EnvironmentError: Domain with ID ${object.id} does not exist`)
			this.domains = this.domains.filter(domain => domain.id !== object.id)
		} else if (object instanceof SubjectController) {
			if (!this.subjects.some(subject => subject.id === object.id))
				throw new Error(`EnvironmentError: Subject with ID ${object.id} does not exist`)
			this.subjects = this.subjects.filter(subject => subject.id !== object.id)
		} else if (object instanceof LectureController) {
			if (!this.lectures.some(lecture => lecture.id === object.id))
				throw new Error(`EnvironmentError: Lecture with ID ${object.id} does not exist`)
			this.lectures = this.lectures.filter(lecture => lecture.id !== object.id)
		} else if (object instanceof LinkController) {
			if (!this.links.some(link => link.id === object.id))
				throw new Error(`EnvironmentError: Link with ID ${object.id} does not exist`)
			this.links = this.links.filter(link => link.id !== object.id)
		} else {
			throw new Error(`EnvironmentError: Invalid object type: ${object}`)
		}
	}
}