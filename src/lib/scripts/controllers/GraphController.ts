// Internal imports
import {
	DomainController, DomainRelationController, 
	SubjectController, SubjectRelationController,
	LectureController, LectureSubject,
	CourseController
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
		private _domains: DomainController[] = [],
		private _subjects: SubjectController[] = [],
		private _lectures: LectureController[] = [],
		private _compact: boolean = true
	) { }

	// Inferred
	domain_relations: DomainRelationController[] = []
	subject_relations: SubjectRelationController[] = []

	get compact() {
		return this._compact
	}

	private set compact(value: boolean) {
		this._compact = value
	}

	get expanded() {
		return !this._compact
	}

	private set expanded(value: boolean) {
		this._compact = !value
	}

	get domains() {

		// Check if the domains are expanded
		if (this.compact) throw new Error('Failed to get domains: Graph is too compact')
		return this._domains
	}

	set domains(value: DomainController[]) {
		this._domains = value
	}

	get subjects() {

		// Check if the subjects are expanded
		if (this.compact) throw new Error('Failed to get subjects: Graph is too compact')
		return this._subjects
	}

	set subjects(value: SubjectController[]) {
		this._subjects = value
	}

	get lectures() {

		// Check if the lectures are expanded
		if (this.compact) throw new Error('Failed to get lectures: Graph is too compact')
		return this._lectures
	}

	set lectures(value: LectureController[]) {
		this._lectures = value
	}

	get lecture_options() {
		/* Return the options of the lecture */

		// Check if the graph is lazy
		if (this._compact) throw new Error('Failed to get lecture options: graph is too compact')

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

	static async create(course: CourseController, name: string): Promise<GraphController> {
		/* Create a new graph */

		// Call the API
		const response = await fetch(`/api/course/${course.id}/graph`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		})

		// Check the response
		.catch(error => {
			throw new Error(`Failed to create graph: ${error}`)
		})

		// Revive the graph
		const data: SerializedGraph = await response.json()
		const graph = await GraphController.revive(data)
		course.graphs.push(graph)
		return graph
	}

	static async revive(data: SerializedGraph, depth: number = 0): Promise<GraphController> {
		/* Revive graph from a POJO */

		const graph = new GraphController(data.id, data.name)
		await graph.expand(depth)
		return graph
	}

	async expand(depth: number = 1): Promise<GraphController> {

		/* Expand the program */

		// Check if expansion is possible
		if (this.expanded || depth < 1) return this
		this.expanded = true

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

		return this
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
		if (this.compact) throw new Error('Failed to validate graph: graph is too compact')

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
		if (this.compact) throw new Error('Failed to sort graph: graph is too compact')

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
		if (this.compact) throw new Error('Failed to get next domain style: graph is too compact')

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
