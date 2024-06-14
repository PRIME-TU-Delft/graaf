
// Internal imports
import { ValidationData, Error } from './ValidationData'
import { Subject } from './Fields'
import { Graph } from './Graph'

// Exports
export { Lecture }


// --------------------> Classes


class Lecture {
	constructor(
		public graph: Graph,
		public id: number,
		public name: string = '',
		public subjects: Subject[] = []
	) { }

	validate(): ValidationData {
		/* Validate the lecture */

		const response = new ValidationData()

		// Check if the lecture has a name
		if (this.name === '')
			response.add(new Error('Lecture has no name'))

		// Check if the name is unique
		else if (this.graph.lectures.some(lecture => lecture !== this && lecture.name === this.name))
			response.add(new Error('Lecture name isn\'t unique'))

		// Check if the lecture has subjects
		if (!this.subjects.length)
			response.add(new Error('Lecture has no subjects'))

		// Check if the lecture has undefined subjects
		else if (this.subjects.some(subject => !subject))
			response.add(new Error('Lecture has undefined subjects'))

		return response
	}
}