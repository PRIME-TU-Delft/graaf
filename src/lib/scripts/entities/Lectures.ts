
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
		return this.presentSubjects
			.filter(subject => subject)
			.flatMap(subject => subject!.parents)
			.filter(parent => !this.presentSubjects.includes(parent))
			.filter((parent, index, self) => self.indexOf(parent) === index)
	}

	get futureSubjects(): Subject[] {
		return this.presentSubjects
			.filter(subject => subject)
			.flatMap(subject => subject!.children)
			.filter(child => !this.presentSubjects.includes(child))
			.filter((subject, index, self) => self.indexOf(subject) === index)
	}

	get subjects(): Subject[] {
		return this.presentSubjects
			.filter(subject => subject)
			.concat(
				this.pastSubjects,
				this.futureSubjects
			) as Subject[]
	}

	get relations(): Relation[] {
		return this.presentSubjects
			.filter(subject => subject)
			.flatMap(subject => [
				...subject!.backwardRelations,
				...subject!.forwardRelations
			])
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