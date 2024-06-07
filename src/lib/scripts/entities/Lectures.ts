
// Internal imports
import { Graph, Subject, Relation } from '../entities'

// Exports
export { Lecture }

class Lecture {
	graph: Graph
	name?: string
	presentSubjects: (Subject | undefined)[]

	constructor(graph: Graph, name?: string, presentSubjects: Subject[] = []) {
		this.graph = graph
		this.name = name
		this.presentSubjects = presentSubjects
	}

	static create(graph: Graph): void {
		const lecture = new Lecture(graph)
		graph.lectures.push(lecture)
	}

	get pastSubjects(): Subject[] {
		const past: Subject[] = []
		for (const subject of this.presentSubjects) {
			if (!subject) continue
			for (const parent of subject.parents) {
				if (this.presentSubjects.includes(parent) || past.includes(parent)) continue
				past.push(parent)
			}
		}

		return past
	}

	get futureSubjects(): Subject[] {
		const future: Subject[] = []
		for (const subject of this.presentSubjects) {
			if (!subject) continue
			for (const child of subject.children) {
				if (this.presentSubjects.includes(child) || future.includes(child)) continue
				future.push(child)
			}
		}

		return future
	}

	get subjects(): Subject[] {
		const subjects: Subject[] = []
		for (const subject of this.presentSubjects) {
			if (!subject) continue
			for (const parent of subject.parents) {
				if (subjects.includes(parent)) continue
				subjects.push(parent)
			}

			for (const child of subject.children) {
				if (subjects.includes(child)) continue
				subjects.push(child)
			}
		}

		return subjects
	}

	get relations(): Relation[] {
		const relations: Relation[] = []
		for (const subject of this.presentSubjects) {
			if (!subject) continue
			for (const relation of subject.relations) {
				if (relations.includes(relation)) continue
				relations.push(relation)
			}
		}

		return relations
	}

	get size(): number {
		return Math.max(
			this.pastSubjects.length,
			this.presentSubjects.length,
			this.futureSubjects.length
		)
	}

	addSubject() {
		this.presentSubjects.push(undefined)
	}

	removeSubject(index: number) {
		this.presentSubjects.splice(index, 1)
	}

	subjectOptions(index: number): { name: string, value: Subject, available: boolean, reason?: string }[] {
		const options = this.graph.subjects
			.filter(subject => subject.name)
			.map(subject => (
				{ name: subject.name, value: subject, available: true }
			)) as { name: string, value: Subject, available: boolean, reason?: string }[]
		
		options.forEach(subject => {
			if (subject.value === this.presentSubjects[index]) return
			if (this.presentSubjects.includes(subject.value)) {
				subject.available = false
				subject.reason = 'Duplicate subject'
			}
		});

		return options
	}

	subjectColor(index: number) {
		return this.presentSubjects[index]?.color ?? 'transparent'
	}

	validate(): boolean {
		return this.name !== undefined && this.presentSubjects.every(subject => subject)
	}

	delete() {
		this.graph.lectures = this.graph.lectures.filter(lecture => lecture !== this)
	}
}