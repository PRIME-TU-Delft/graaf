
// Exports
export { Course }

class Course {
	code: string
	name: string

	constructor(data: object) {
		// TODO load from database

		this.code = 'CSE1200'
		this.name = 'Calculus'
	}
}