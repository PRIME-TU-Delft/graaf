
// External imports
import * as uuid from 'uuid'

// Internal imports
import { DropdownOption } from './DropdownOption'
import { ValidationData, Error } from './ValidationData'
import { DomainRelation, SubjectRelation } from './Relations'
import { Domain, Subject } from './Fields'
import { Lecture, LectureSubject } from './Lecture'

// Exports
export { Graph }


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

	static load(obj: Object): Graph {
		/* Load the graph from a POJO */

		throw new Error('Not implemented')
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

	save() {
		/* Save the graph to the database */

		throw new Error('Not implemented')
	}

	delete() {
		/* Delete the graph from the database */

		throw new Error('Not implemented')
	}
}