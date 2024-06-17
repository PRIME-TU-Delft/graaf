
// Internal imports
import { ValidationData, Error } from "./ValidationData"
import { DropdownOption } from "./DropdownOption"

// Exports
export { Course, AssignedUser }


// --------------------> Enums


enum Permissions {
	read,
	write,
	admin
}


// --------------------> Classes


class AssignedUser {
	constructor(
		public course: Course,
		public name: string,
		public permissions: Permissions
	) { }

	static create(course: Course, name: string, permissions: Permissions) {
		/* Create a new assigned user */

		const user = new AssignedUser(course, name, permissions)
		course.users.push(user)
		return user
	}

	delete() {
		/* Delete the assigned user */

		this.course.users = this.course.users.filter(user => user !== this)
	}
}

class Course {
	constructor(
		public code: string,
		public name: string,
		public users: AssignedUser[] = [],
	) { }

	get permission_options(): DropdownOption<Permissions>[] {
		/* Get the permission options */

		const validation = new ValidationData()

		return [
			new DropdownOption('Read', Permissions.read, validation),
			new DropdownOption('Write', Permissions.write, validation),
			new DropdownOption('Admin', Permissions.admin, validation)
		]
	}

	static revive(obj: Object) {
		/* Load the course from a POGO */

		// TODO this is a placeholder
		const course = new Course(
			'CSE1200',
			'Calculus',
		)

		AssignedUser.create(course, 'Bram Kreulen', Permissions.admin)
		return course
	}

	validate(): ValidationData {
		/* Validate the course */

		const response = new ValidationData()

		// Check if the course code is valid
		if (this.code === '') {
			response.add(new Error('Course must have a code'))
		}

		// Check if the course name is valid
		if (this.name === '') {
			response.add(new Error('Course must have a name'))
		}

		return response
	}

	delete() {
		/* Delete the course */

		throw new Error('Not implemented')
	}
}
