// Internal imports
import { ValidationData, Error } from './Validation'
import { DropdownOption } from './DropdownOption'

import { Domain, Subject } from './Fields'
import { DomainRelation, SubjectRelation } from './Relations'
import { Lecture, LectureSubject } from './Lecture'

import type { SerializedLecture } from './Lecture'
import type { SerializedSubject } from './Fields'
import type { SerializedDomain } from './Fields'

// Exports
export { Graph }
export type { SerializedGraph }


// --------------------> Types


type ID = number

type SerializedGraph = {
	id: ID,
	name: string,
	domains: SerializedDomain[],
	subjects: SerializedSubject[],
	lectures: SerializedLecture[]
}


// --------------------> Classes


class Graph {
	constructor(
		public id: ID,
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

	static revive(data: SerializedGraph) {
		/* Revive graph from a POJO */

		const graph = new Graph(data.id, data.name)

		// Define domains
		for (const domain_data of data.domains) {
			graph.domains.push(
				new Domain(
					graph,
					graph.domains.length,
					domain_data.id,
					domain_data.x,
					domain_data.y,
					domain_data.style,
					domain_data.name
				)
			)
		}

		// Build domain relations
		for (const parent_data of data.domains) {
			const parent = graph.domains.find(domain => domain.id === parent_data.id)
			if (!parent) continue

			for (const child_id of parent_data.children) {
				const child = graph.domains.find(domain => domain.id === child_id)
				if (!child) continue

				const relation = DomainRelation.create(graph)
				relation.parent = parent
				relation.child = child
			}
		}

		// Define subjects
		for (const subject_data of data.subjects) {
			const domain = graph.domains.find(domain => domain.id === subject_data.domain)

			graph.subjects.push(
				new Subject(
					graph,
					graph.subjects.length,
					subject_data.id,
					subject_data.x,
					subject_data.y,
					domain,
					subject_data.name
				)
			)
		}

		// Build subject relations
		for (const parent_data of data.subjects) {
			const parent = graph.subjects.find(subject => subject.id === parent_data.id)
			if (!parent) continue

			for (const child_id of parent_data.children) {
				const child = graph.subjects.find(subject => subject.id === child_id)
				if (!child) continue

				const relation = SubjectRelation.create(graph)
				relation.parent = parent
				relation.child = child
			}
		}

		// Define lectures
		for (const lecture_data of data.lectures) {
			const lecture = new Lecture(
				graph,
				lecture_data.id,
				graph.lectures.length,
				lecture_data.name
			)

			graph.lectures.push(lecture)

			// Define lecture subjects
			for (const subject_id of lecture_data.subjects) {
				const subject = graph.subjects.find(subject => subject.id === subject_id)
				if (!subject) continue

				const lecture_subject = LectureSubject.create(lecture)
				lecture_subject.subject = subject
			}
		}

		return graph
	}

	private hasName(): boolean {
		/* Check if the graph has a name */

		return this.name !== ''
	}

	validate(): ValidationData {
		/* Validate the graph */

		const response = new ValidationData()

		// Check if the graph has a name
		if (!this.hasName()) {
			response.add(
				new Error(
					'Graph must have a name',
					undefined,
					0, 'name'
				)
			)
		}

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
		/* Reduce graph to a POJO */

		return {
			id: this.id,
			name: this.name,
			domains: this.domains.map(domain => domain.reduce()),
			subjects: this.subjects.map(subject => subject.reduce()),
			lectures: this.lectures.map(lecture => lecture.reduce())
		}
	}

	async save() {
		/* Save the graph to the database */

		const response = await fetch(`/api/graph/${this.id}`, {
			method: 'PUT',
			body: JSON.stringify(this.reduce())
		});

		if (response.ok) {
			console.log('[*] Graph saved!');
		}
		else {
			const message = await response.text();
			console.error(`Failed to save graph: ${message}`);
		}
	}

	delete() {
		/* Delete the graph from the database */
	}

	// TODO: Temp because these were used in mocked data in course overview
	hasLinks = () => true
	isVisible = () => true
}
