
// Internal imports
import { Domain, Subject, Relation, Lecture } from '../entities'
import { styles } from '../settings'

// Exports
export { Graph }

class Graph {
	id: number
	name: string
	domains: Domain[]
	subjects: Subject[]
	lectures: Lecture[]

	constructor(data: object) {
		this.id = 1
		this.name = 'Graph 1'
		this.domains = []
		this.subjects = []
		this.lectures = []

		// TODO load from data

		this.domains.push(
			new Domain(this, 1, 0, 0, [], [], 'Domain 1', 'prosperous-red'),
			new Domain(this, 2, 0, 0, [], [], 'Domain 2', 'energizing-orange'),
			new Domain(this, 3, 0, 0, [], [], 'Domain 3', 'sunny-yellow')
		)

		this.subjects.push(
			new Subject(this, 4, 0, 0, [], [], 'Subject 1', this.domains[0]),
			new Subject(this, 5, 0, 0, [], [], 'Subject 2', this.domains[0]),
			new Subject(this, 6, 0, 0, [], [], 'Subject 3', this.domains[1]),
			new Subject(this, 7, 0, 0, [], [], 'Subject 4', this.domains[1]),
			new Subject(this, 8, 0, 0, [], [], 'Subject 5', this.domains[2]),
			new Subject(this, 9, 0, 0, [], [], 'Subject 6', this.domains[2])
		)

		Relation.create(this, this.domains[0], this.domains[1])
		Relation.create(this, this.domains[1], this.domains[2])
		Relation.create(this, this.domains[0], this.domains[2])
		Relation.create(this, this.subjects[0], this.subjects[1])
		Relation.create(this, this.subjects[2], this.subjects[3])
		Relation.create(this, this.subjects[4], this.subjects[5])
		Relation.create(this, this.subjects[0], this.subjects[2])
		Relation.create(this, this.subjects[1], this.subjects[3])
		Relation.create(this, this.subjects[2], this.subjects[4])

		this.lectures.push(
			new Lecture(this, 'Lecture 1', [this.subjects[2], this.subjects[4]]),
		)
	}

	get domainRelations(): Relation[] {
		let relations: Relation[] = []
		for (const domain of this.domains) {
			for (const child of domain.children) {
				relations.push(new Relation(this, domain, child))
			}
		}

		return relations
	}

	get subjectRelations(): Relation[] {
		let relations: Relation[] = []
		for (const subject of this.subjects) {
			for (const child of subject.children) {
				relations.push(new Relation(this, subject, child))
			}
		}

		return relations
	}

	get domainOptions(): { name: string, value: Domain, available: boolean, reason?: string }[] {
		return this.domains
			.filter(domain => domain.name)
			.map(domain => (
				{ name: domain.name, value: domain, available: true }
			)) as { name: string, value: Domain, available: boolean, reason?: string }[]
	
	}

	get lectureOptions(): { name: string, value: Lecture, available: boolean, reason?: string }[] {
		return this.lectures
			.filter(lecture => lecture.name)
			.map(lecture => (
				{ name: lecture.name, value: lecture, available: true }
			)) as { name: string, value: Lecture, available: boolean, reason?: string }[]
	}

	get styleOptions(): { name: string, value: string, available: boolean, reason?: string }[] {
		return Object.keys(styles)
			.map(style => (
				{ name: styles[style].display_name, value: style, available: true }
			))
	}

	validate(): boolean {
		for (const domain of this.domains)
			if (!domain.validate()) return false
		for (const subject of this.subjects)
			if (!subject.validate()) return false
		for (const lecture of this.lectures)
			if (!lecture.validate()) return false

		return true
	}

	serialize(): object {
		throw new Error('Not implemented')
	}

	save() {
		throw new Error('Not implemented')
	}

	delete() {
		throw new Error('Not implemented')
	}

	nextFieldID(): number {
		const ids = this.domains.concat(this.subjects).map(field => field.id)
		return Math.max(0, ...ids) + 1
	}

	nextDomainStyle(): string | undefined {
		const usedStyles = this.domains.map(domain => domain.style)
		return Object.keys(styles).find(style => !usedStyles.includes(style))
	}
}