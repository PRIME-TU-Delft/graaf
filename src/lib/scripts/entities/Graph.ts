
// Internal imports
import { ValidationData, Error } from './ValidationData'
import { DomainRelation, SubjectRelation } from './Relations'
import { Domain, Subject } from './Fields'
import { Lecture } from './Lecture'

// Exports
export { Graph }


// --------------------> Classes


class Graph {
	constructor(
		public id: number, 
		public name: string = '', 
		public domains: Domain[] = [], 
		public subjects: Subject[] = [], 
		public lectures: Lecture[] = []
	) { }

	// Inferred
	domain_relations: DomainRelation[] = []
	subject_relations: SubjectRelation[] = []

	static create(id: number): Graph {
		/* Create a new graph */

		return new Graph(id)
	}

	static load(obj: Object): Graph {
		/* Load the graph from a POGO */

		// TODO this is a placeholder
		return new Graph(
			1, 'Graph'
		)
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
		for (const subject of this.subjects)
			response.add(subject.validate())
		for (const lecture of this.lectures)
			response.add(lecture.validate())
		for (const relation of this.domain_relations)
			response.add(relation.validate())
		for (const relation of this.subject_relations)
			response.add(relation.validate())

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