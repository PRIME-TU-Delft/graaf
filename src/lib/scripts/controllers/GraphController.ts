// Internal imports
import {
	DomainController, DomainRelationController, 
	SubjectController, SubjectRelationController,
	LectureController, LectureSubject
} from '$scripts/controllers'

import { ValidationData, Severity } from '$scripts/validation'
import { styles } from '$scripts/settings'

import type { SerializedGraph } from '$scripts/types'

// Exports
export { GraphController, SortOption }


// --------------------> Classes


type SortOptions = number
enum SortOption {
	ascending  = 0b000000000,
	descending = 0b100000000,
	domains    = 0b010000000,
	subjects   = 0b001000000,
	relations  = 0b000100000,
	name       = 0b000010000,
	style      = 0b000001000,
	domain     = 0b000000100,
	parent     = 0b000000010,
	child      = 0b000000001
}

class GraphController {
	constructor(
		public id: number,
		public name: string,
		public domains: DomainController[] = [],
		public subjects: SubjectController[] = [],
		public lectures: LectureController[] = [],
		private _lazy: boolean = true
	) { }

	// Inferred
	domain_relations: DomainRelationController[] = []
	subject_relations: SubjectRelationController[] = []

	get lazy() {
		return this._lazy
	}

	get lecture_options() {
		/* Return the options of the lecture */

		// Check if the graph is lazy
		if (this._lazy) throw new Error('Failed to get lecture options: graph is lazy')

		// Find lecture options
		const options = []
		for (const lecture of this.lectures) {
			options.push({
				name: lecture.name,
				value: lecture,
				validation: ValidationData.success()
			})
		}

		return options
	}

	static async revive(data: SerializedGraph, lazy: boolean = true): Promise<GraphController> {
		/* Revive graph from a POJO */

		const graph = new GraphController(data.id, data.name)
		if (!lazy) await graph.unlazify()
		return graph
	}

	async unlazify(): Promise<void> {

		// Check if the graph is already loaded
		if (!this._lazy) return

		// Call the API
		const urls = [
			`/api/graph/${this.id}/domain`,
			`/api/graph/${this.id}/subject`,
			`/api/graph/${this.id}/lecture`
		]

		const [domains, subjects, lectures] = await Promise.all(
			urls.map(url => fetch(url, { method: 'GET' })
				.then(response => response.json())
				.catch(error => { throw new Error(`Failed to load graph: ${error}`) })
			)
		)

		// Define domains
		for (const domain_data of domains) {
			this.domains.push(
				new DomainController(
					this,
					this.domains.length,
					domain_data.id,
					domain_data.x,
					domain_data.y,
					domain_data.name ?? '',
					domain_data.style ?? undefined
				)
			)
		}

		// Find domain references
		for (const parent_data of domains) {
			const parent = this.domains.find(domain => domain.id === parent_data.id)
			for (const child_id of parent_data.children) {
				const child = this.domains.find(domain => domain.id === child_id)

				// Create relation
				DomainRelationController.create(this, parent, child)
			}
		}

		// Define subjects
		for (const subject_data of subjects) {
			const domain = this.domains.find(domain => domain.id === subject_data.domain)

			this.subjects.push(
				new SubjectController(
					this,
					this.subjects.length,
					subject_data.id,
					subject_data.x,
					subject_data.y,
					subject_data.name ?? '',
					domain
				)
			)
		}

		// Find subject references
		for (const parent_data of subjects) {
			const parent = this.subjects.find(subject => subject.id === parent_data.id)
			for (const child_id of parent_data.children) {
				const child = this.subjects.find(subject => subject.id === child_id)

				// Create relation
				SubjectRelationController.create(this, parent, child)
			}
		}

		// Define lectures
		for (const lecture_data of lectures) {
			const lecture = new LectureController(
				this,
				this.lectures.length,
				lecture_data.id,
				lecture_data.name ?? ''
			)

			this.lectures.push(lecture)

			// Define lecture subjects
			for (const subject_id of lecture_data.subjects) {
				const subject = this.subjects.find(subject => subject.id === subject_id)
				LectureSubject.create(lecture, subject)
			}
		}

		// Unlazify
		this._lazy = false
	}

	async save() {
		/* Save the graph to the database */

		// Call the API
		await fetch(`/api/graph`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(this.reduce())
		})

		// Check the response
		.catch(error => {
			throw new Error(`Failed to save graph: ${error}`)
		})
	}

	async delete() {
		/* Delete the graph from the database */

		// Call the API
		await fetch(`/api/graph/${this.id}`, { method: 'DELETE' })
			.catch(error => { throw new Error(`Failed to delete graph: ${error}`) })
	}

	validate(): ValidationData {
		/* Validate the graph */

		// Check if the graph is lazy
		if (this._lazy) throw new Error('Failed to validate graph: graph is lazy')

		// Create response
		const validation = new ValidationData()

		// Check if the graph has a name
		if (this.name === '') {
			validation.add({
				severity: Severity.error,
				short: 'Graph has no name',
				long: 'The graph must have a name',
				tab: 0,
				anchor: 'name'
			})
		}

		// Validate domains, subjects and lectures
		for (const domain of this.domains)
			validation.add(domain.validate())
		for (const relation of this.domain_relations)
			validation.add(relation.validate())
		for (const subject of this.subjects)
			validation.add(subject.validate())
		for (const relation of this.subject_relations)
			validation.add(relation.validate())
		for (const lecture of this.lectures)
			validation.add(lecture.validate())

		return validation
	}

	sort(options: SortOptions): void {
		/* Sort the graph */

		// Check if the graph is lazy
		if (this._lazy) throw new Error('Failed to sort graph: graph is lazy')

		// Define key function
		let key: (item: any) => string
		if (options & SortOption.relations) {
			if (options & SortOption.parent) {
				key = relation => relation.parent?.name ?? ''
			} else if (options & SortOption.child) { 
				key = relation => relation.child?.name ?? ''
			} else return
		} else if (options & SortOption.name) {
			key = field => field.name
		} else if (options & SortOption.style) {
			key = domain => domain.style ? styles[domain.style].display_name : ''
		} else if (options & SortOption.domain) {
			key = subject => subject.domain?.name ?? ''
		} else return

		// Sort the appropriate fields
		if (options & SortOption.relations) {
			if (options & SortOption.domains) {
				this.domain_relations.sort((a, b) => key(b).localeCompare(key(a)))
				if (options & SortOption.descending) this.domain_relations.reverse()
			} else if (options & SortOption.subjects) {
				this.subject_relations.sort((a, b) => key(b).localeCompare(key(a)))
				if (options & SortOption.descending) this.subject_relations.reverse()
			}
		} else {
			if (options & SortOption.domains) {
				this.domains.sort((a, b) => key(b).localeCompare(key(a)))
				if (options & SortOption.descending) this.domains.reverse()
			} else if (options & SortOption.subjects) {
				this.subjects.sort((a, b) => key(b).localeCompare(key(a)))
				if (options & SortOption.descending) this.subjects.reverse()
			}
		}
	}
	
	nextDomainStyle(): string | undefined {
		/* Return the next available domain style */

		// Check if the graph is lazy
		if (this._lazy) throw new Error('Failed to get next domain style: graph is lazy')

		// Find used styles
		const used_styles = this.domains.map(domain => domain.style)
		return Object.keys(styles).find(style => !used_styles.includes(style))
	}

	reduce(): SerializedGraph {
		/* Reduce graph to a POJO */

		return {
			id: this.id,
			name: this.name
		}
	}

	// TODO: Temp because these were used in mocked data in course overview
	hasLinks = () => true
	isVisible = () => true
}
