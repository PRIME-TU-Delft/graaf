
// Internal imports
import { ValidationData, Error, Warning } from './ValidationData'
import { DropdownOption } from './DropdownOption'
import { SubjectRelation } from './Relations'
import { Subject } from './Fields'
import { Graph } from './Graph'

// Exports
export { Lecture, LectureSubject }


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
		public uuid: string,
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

	static create(graph: Graph): Lecture {
		/* Create a new lecture */

		const lecture = new Lecture(
			graph,
			Graph.generateUUID(),
			graph.lectures.length
		)

		graph.lectures.push(lecture)
		return lecture
	}

	validate(): ValidationData {
		/* Validate the lecture */

		const response = new ValidationData()

		// Check if the lecture has a name
		if (this.name === '')
			response.add(new Error(`Lecture (${this.index + 1}) has no name`))

		// Check if the name is unique
		else {
			const first = this.graph.lectures.findIndex(lecture => lecture.name === this.name)
			if (first < this.graph.lectures.indexOf(this)) {
				response.add(
					new Warning(
						`Lecture (${this.index + 1}) name isn\'t unique`,
						`First used by lecture (${this.graph.lectures[first].index + 1})`
					)
				)
			}
		}

		// Check if the lecture has subjects
		if (!this.lecture_subjects.length)
			response.add(new Error(`Lecture (${this.index + 1}) has no subjects`))

		// Check if the lecture has undefined subjects
		else if (this.lecture_subjects.some(subject => !subject))
			response.add(new Error(`Lecture (${this.index + 1}) has undefined subjects`))

		return response
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
