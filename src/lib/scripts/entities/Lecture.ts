
// Internal imports
import { ValidationData, Error, Warning } from './ValidationData'
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
			response.add(new Error(`Lecture (${this.id}) has no name`))

		// Check if the name is unique
		else {
			const first = this.graph.domains.findIndex(lecture => lecture.name === this.name)
			if (first < this.graph.lectures.indexOf(this)) {
				response.add(
					new Warning(
						`Lecture (${this.id}) name isn\'t unique`, 
						`First used by lecture (${this.graph.domains[first].id})`
					)
				)
			}
		}

		// Check if the lecture has subjects
		if (!this.subjects.length)
			response.add(new Error('Lecture has no subjects'))

		// Check if the lecture has undefined subjects
		else if (this.subjects.some(subject => !subject))
			response.add(new Error('Lecture has undefined subjects'))

		return response
	}
}