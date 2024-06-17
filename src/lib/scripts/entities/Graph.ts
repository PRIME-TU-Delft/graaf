
// External imports
import * as uuid from 'uuid'

// Internal imports
import { DomainRelation, SubjectRelation } from './Relations'
import { ValidationData, Error } from './ValidationData'
import { Lecture, LectureSubject } from './Lecture'
import { DropdownOption } from './DropdownOption'
import { Domain, Subject } from './Fields'

import type { SerializedLecture } from './Lecture'
import type { SerializedSubject } from './Fields'
import type { SerializedDomain } from './Fields'

// Exports
export { Graph }
export type { UUID, SerializedGraph }


// --------------------> Types


type UUID = string
type SerializedGraph = {
	uuid: UUID,
	name: string,
	domains: SerializedDomain[],
	subjects: SerializedSubject[],
	lectures: SerializedLecture[]
}


// --------------------> Classes


class Graph {
	constructor(
		public uuid: string,
		public name: string = '',
		public domains: Domain[] = [],
		public subjects: Subject[] = [],
		public lectures: Lecture[] = []
	) { }

	// Inferred
	domain_relations: DomainRelation[] = []
	subject_relations: SubjectRelation[] = []

	get lecture_options(): DropdownOption<Lecture>[] {
		/* Return the options of the lecture */

		const options = []
		for (const lecture of this.lectures) {
			options.push(
				new DropdownOption(
					lecture.name,
					lecture,
					new ValidationData()
				)
			)
		}

		return options
	}

	static create(): Graph {
		/* Create a new graph */

		const graph = new Graph(Graph.generateUUID())
		graph.name = 'New Graph'

		let domain = Domain.create(graph)
		domain.name = 'Domain 1'
		domain.style = 'prosperous-red'

		domain = Domain.create(graph)
		domain.name = 'Domain 2'
		domain.style = 'energizing-orange'

		domain = Domain.create(graph)
		domain.name = 'Domain 3'
		domain.style = 'sunny-yellow'

		let domain_relation = DomainRelation.create(graph)
		domain_relation.parent = graph.domains[0]
		domain_relation.child = graph.domains[1]

		domain_relation = DomainRelation.create(graph)
		domain_relation.parent = graph.domains[0]
		domain_relation.child = graph.domains[2]

		domain_relation = DomainRelation.create(graph)
		domain_relation.parent = graph.domains[1]
		domain_relation.child = graph.domains[2]

		let subject = Subject.create(graph)
		subject.name = 'Subject 1'
		subject.domain = graph.domains[0]

		subject = Subject.create(graph)
		subject.name = 'Subject 2'
		subject.domain = graph.domains[0]

		subject = Subject.create(graph)
		subject.name = 'Subject 3'
		subject.domain = graph.domains[1]

		subject = Subject.create(graph)
		subject.name = 'Subject 4'
		subject.domain = graph.domains[2]

		subject = Subject.create(graph)
		subject.name = 'Subject 5'
		subject.domain = graph.domains[2]

		let subject_relation = SubjectRelation.create(graph)
		subject_relation.parent = graph.subjects[0]
		subject_relation.child = graph.subjects[1]

		subject_relation = SubjectRelation.create(graph)
		subject_relation.parent = graph.subjects[0]
		subject_relation.child = graph.subjects[2]

		subject_relation = SubjectRelation.create(graph)
		subject_relation.parent = graph.subjects[1]
		subject_relation.child = graph.subjects[2]

		subject_relation = SubjectRelation.create(graph)
		subject_relation.parent = graph.subjects[2]
		subject_relation.child = graph.subjects[3]

		subject_relation = SubjectRelation.create(graph)
		subject_relation.parent = graph.subjects[2]
		subject_relation.child = graph.subjects[4]

		let lecture = Lecture.create(graph)
		lecture.name = 'Lecture 1'

		let lecture_subject = LectureSubject.create(lecture)
		lecture_subject.subject = graph.subjects[1]

		lecture_subject = LectureSubject.create(lecture)
		lecture_subject.subject = graph.subjects[2]

		return graph
	}

	static revive(data: SerializedGraph) {
		/* Load the graph from a POJO */

		const graph = new Graph(data.uuid, data.name)

		// Define domains
		for (const domain_data of data.domains) {
			graph.domains.push(
				new Domain(
					graph,
					graph.domains.length,
					domain_data.uuid,
					domain_data.x,
					domain_data.y,
					domain_data.style,
					domain_data.name
				)
			)
		}

		// Build domain relations
		for (const parent_data of data.domains) {
			const parent = graph.domains.find(domain => domain.uuid === parent_data.uuid)
			if (!parent) throw new Error('Failed to revive, non-existent UUID in domain relations')

			for (const child_uuid of parent_data.children) {
				const child = graph.domains.find(domain => domain.uuid === child_uuid)
				if (!child) throw new Error('Failed to revive, non-existent UUID in domain relations')

				const relation = DomainRelation.create(graph)
				relation.parent = parent
				relation.child = child
			}
		}

		// Define subjects
		for (const subject_data of data.subjects) {
			const domain = graph.domains.find(domain => domain.uuid === subject_data.domain)
			if (!domain) throw new Error('Failed to revive, non-existent UUID in subjects')

			graph.subjects.push(
				new Subject(
					graph,
					graph.subjects.length,
					subject_data.uuid,
					subject_data.x,
					subject_data.y,
					domain,
					subject_data.name
				)
			)
		}

		// Build subject relations
		for (const parent_data of data.subjects) {
			const parent = graph.subjects.find(subject => subject.uuid === parent_data.uuid)
			if (!parent) throw new Error('Failed to revive, non-existent UUID in subject relations')

			for (const child_uuid of parent_data.children) {
				const child = graph.subjects.find(subject => subject.uuid === child_uuid)
				if (!child) throw new Error('Failed to revive, non-existent UUID in subject relations')

				const relation = SubjectRelation.create(graph)
				relation.parent = parent
				relation.child = child
			}
		}

		// Define lectures
		for (const lecture_data of data.lectures) {
			const lecture = new Lecture(
				graph,
				lecture_data.uuid,
				graph.lectures.length,
				lecture_data.name
			)

			graph.lectures.push(lecture)

			// Define lecture subjects
			for (const subject_uuid of lecture_data.subjects) {
				const subject = graph.subjects.find(subject => subject.uuid === subject_uuid)
				if (!subject) throw new Error('Failed to revive, non-existent UUID in lecture subjects')

				const lecture_subject = LectureSubject.create(lecture)
				lecture_subject.subject = subject
			}
		}

		return graph
	}

	static generateUUID(): string {
		/* Generate a new UUID */

		return uuid.v4()
	}

	validate(): ValidationData {
		/* Validate the graph */

		const response = new ValidationData()

		// Check if the graph has a name
		if (this.name === '')
			response.add(new Error('Graph must have a name'))

		// Validate domains, subjects and lectures
		for (const domain of this.domains)
			response.add(domain.validate())
		for (const relation of this.domain_relations)
			response.add(relation.validate())
		for (const subject of this.subjects)
			response.add(subject.validate())
		for (const relation of this.subject_relations)
			response.add(relation.validate())
		for (const lecture of this.lectures)
			response.add(lecture.validate())

		return response
	}

	reduce(): SerializedGraph {
		/* Serialize graph to a POJO */

		if (this.validate().severity === 'error')
			throw new Error('Cannot reduce with outstanding errors')

		return {
			uuid: this.uuid,
			name: this.name,
			domains: this.domains.map(domain => domain.reduce()),
			subjects: this.subjects.map(subject => subject.reduce()),
			lectures: this.lectures.map(lecture => lecture.reduce())
		}
	}

	save() {
		/* Save the graph to the database */

		console.log(this.reduce())
	}

	delete() {
		/* Delete the graph from the database */

		throw new Error('Not implemented')
	}
}
