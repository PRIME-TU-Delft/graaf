
// Internal imports
import { ValidationData, Error } from './ValidationData'
import { DropdownOption } from './DropdownOption'

import { Graph } from './Graph'
import { Subject } from './Fields'
import { SubjectRelation } from './Relations'

// Exports
export { Lecture, LectureSubject }
export type { SerializedLecture }


// --------------------> Type

type ID = number

type SerializedLecture = {
	id: ID,
	name: string,
	subjects: ID[]
}

// --------------------> Classes


class LectureSubject {
	constructor(
		public lecture: Lecture,
		public subject?: Subject
	) { }

	static create(lecture: Lecture): LectureSubject {
		/* Create a new lecture subject */

		const lecture_subject = new LectureSubject(lecture)
		lecture.lecture_subjects.push(lecture_subject)
		return lecture_subject
	}

	get color(): string {
		/* Return the color of the subject */

		return this.subject?.color || 'transparent'
	}

	get options(): DropdownOption<Subject>[] {
		/* Return the options of the subject */

		const options = []
		for (const subject of this.lecture.graph.subjects) {
			if (subject.name === '') continue

			// Check if the subject is already in the lecture
			const validation = new ValidationData()
			if (this.lecture.present.includes(subject)) {
				validation.add(new Error('Subject already in lecture'))
			}

			options.push(
				new DropdownOption(
					subject.name,
					subject,
					validation
				)
			)
		}

		return options
	}

	delete() {
		/* Delete this lecture subject */

		this.lecture.lecture_subjects = this.lecture.lecture_subjects.filter(subject => subject !== this)
	}
}

class Lecture {
	constructor(
		public graph: Graph,
		public id: ID,
		public index: number,
		public name: string = '',
		public lecture_subjects: LectureSubject[] = []
	) { }

	get size(): number {
		/* Return the size of the lecture */

		return Math.max(
			this.past.length,
			this.present.length,
			this.future.length
		)
	}

	get past(): Subject[] {
		/* Return the past of this lecture */

		const past: Subject[] = []
		for (const lecture_subject of this.lecture_subjects) {
			if (!lecture_subject.subject) continue
			for (const parent of lecture_subject.subject.parents) {
				if (this.present.includes(parent) || past.includes(parent))
					continue
				past.push(parent)
			}
		}

		return past
	}

	get present(): Subject[] {
		/* Return the present of this lecture */

		const present: Subject[] = []
		for (const lecture_subject of this.lecture_subjects) {
			if (!lecture_subject.subject) continue
			present.push(lecture_subject.subject)
		}

		return present
	}

	get future(): Subject[] {
		/* Return the future of this lecture */

		const future: Subject[] = []
		for (const lecture_subject of this.lecture_subjects) {
			if (!lecture_subject.subject) continue
			for (const child of lecture_subject.subject.children) {
				if (this.present.includes(child) || future.includes(child))
					continue
				future.push(child)
			}
		}

		return future
	}

	get subjects(): Subject[] {
		/* Return the fields of this lecture */

		return this.past
			.concat(this.present)
			.concat(this.future)
	}

	get relations(): SubjectRelation[] {
		/* Return the relations of this lecture */

		const relations: SubjectRelation[] = []
		for (const subject of this.present) {
			for (const relation of this.graph.subject_relations) {
				if (relation.child === subject || relation.parent === subject) {
					relations.push(relation)
				}
			}
		}

		return relations
	}

	private hasName(): boolean {
		/* Check if the lecture has a name */

		return this.name !== ''
	}

	private hasSubjects(): boolean {
		/* Check if the lecture has subjects */

		return this.lecture_subjects.length > 0
	}

	private isDefined(): boolean {
		/* Check if the lecture is defined */

		return this.lecture_subjects.every(lecture_subject => lecture_subject.subject)
	}

	private findOriginal<S, T>(list: S[], value: S, key: (item: S) => T): number {
		/* Find the original item in a list
		 * Returns -1 if value doesn't exist, or isnt a duplicate
		 * Returns the index of the first duplicate otherwise
		 */

		const first = list.findIndex(item => key(item) === key(value))
		const index = list.indexOf(value, first + 1)
		return index === -1 ? -1 : first
	}

	validate(): ValidationData {
		/* Validate the lecture */

		const response = new ValidationData()

		// Check if the lecture has a name
		if (!this.hasName()){
			response.add(
				new Error(
					'Lecture has no name',
					undefined,
					3, this.id.toString()
				)
			)
		}

		// Check if the name is unique
		else {
			const first = this.findOriginal(this.graph.lectures, this, lecture => lecture.name)
			if (first !== -1) {
				response.add(
					new Error(
						'Lecture name must be unique',
						`Name first used by Lecture nr. ${first + 1}`,
						3, this.id.toString()
					)
				)
			}
		}

		// Check if the lecture has subjects
		if (this.hasSubjects()) {
			response.add(
				new Error(
					'Lecture has no subjects',
					undefined,
					3, this.id.toString()
				)
			)
		}

		// Check if the lecture has undefined subjects
		else if (!this.isDefined()) {
			response.add(
				new Error(
					'Lecture has undefined subjects',
					'Make sure all subjects are defined',
					3, this.id.toString()
				)
			)
		}

		return response
	}

	reduce(): SerializedLecture {
		/* Serialize lecture to a POJO */

		return {
			id: this.id,
			name: this.name,
			subjects: this.present.map(subject => subject.id)
		}
	}

	delete() {
		/* Delete this lecture */

		// Shift indexes
		for (const lecture of this.graph.lectures) {
			if (lecture.index > this.index)
				lecture.index--
		}

		// Remove this lecture from the graph
		this.graph.lectures = this.graph.lectures.filter(lecture => lecture !== this)
	}
}
