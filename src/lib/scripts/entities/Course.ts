
// Exports
export { Course }


// --------------------> Classes


class Course {
	constructor(
		public code: string,
		public name: string = ''
	) { }

	static create(code: string): Course {
		/* Create a new course */

		return new Course(code)
	}

	static revive(obj: Object) {
		/* Load the course from a POGO */

		// TODO this is a placeholder
		return new Course(
			'CSE1200',
			'Calculus'
		)
	}
}
