
// External imports
import * as uuid from 'uuid'

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
		public uuid: string,
		public name: string = '', 
		public domains: Domain[] = [], 
		public subjects: Subject[] = [], 
		public lectures: Lecture[] = []
	) { }

	// Inferred
	domain_relations: DomainRelation[] = []
	subject_relations: SubjectRelation[] = []

	static create(): Graph {
		/* Create a new graph */

		return new Graph(uuid.v4())
	}

	static load(obj: Object): Graph {
		/* Load the graph from a POJO */

		throw new Error('Not implemented')
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