
// Internal imports
import { ValidationData, Error } from "./Validation"
import { DropdownOption } from "./DropdownOption"

// Exports
export { Course, AssignedUser, Permissions }
export type { SerializedCourse, SerializedAssignedUser }


// --------------------> Types

type SerializedAssignedUser = {
	id: ID,
	netid: string,
	first_name: string,
	last_name: string,
	email?: string,
	permissions: Permissions
}

type SerializedCourse = {
	code: string,
	name: string,
	users: SerializedAssignedUser[]
}

enum Permissions {
	read,
	write,
	admin
}


// --------------------> Classes

type ID = number;

class AssignedUser {
	constructor(
		public course: Course,
		public id: ID,
		public netid: string,
		public index: number,
		public first_name: string,
		public last_name: string,
		public permissions?: Permissions
	) { }

	static create(course: Course) {
		/* Create a new assigned user */
		// TODO make not this

		const user = new AssignedUser(
			course,
			1,
			'jsmith',
			course.users.length,
			'John',
			'Smith'
		)
		course.users.push(user)
		return user
	}

	validate(): ValidationData {
		/* Validate the assigned user */

		const response = new ValidationData()

		// Check if the user name is valid
		if (this.first_name === '' || this.last_name === '') {
			response.add(
				new Error(
					'User must have a name',
					undefined,
					1, `user-${this.id}`
				)
			)
		}

		// Check if the user has permissions
		if (this.permissions === undefined) {
			response.add(
				new Error(
					'User must have permissions',
					undefined,
					1, `user-${this.id}`
				)
			)
		}

		return response
	}

	reduce(): SerializedAssignedUser {
		/* Reduce the assigned user to a POJO */
		return {
			id: this.id,
			netid: this.netid,
			first_name: this.first_name,
			last_name: this.last_name,
			permissions: this.permissions!
		}
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

	static revive(data: SerializedCourse) {
		/* Load the course from a POGO */

		const course = new Course(data.code, data.name)
		for (const user_data of data.users) {
			const user = AssignedUser.create(course)
			user.id = user_data.id
			user.netid = user_data.netid
			user.first_name = user_data.first_name
			user.last_name = user_data.last_name
			user.permissions = user_data.permissions
		}

		return course
	}

	validate(): ValidationData {
		/* Validate the course */

		const response = new ValidationData()

		// Check if the course code is valid
		if (this.code === '') {
			response.add(
				new Error(
					'Course must have a code',
					undefined,
					0, 'code'
				)
			)
		}

		// Check if the course name is valid
		if (this.name === '') {
			response.add(
				new Error(
					'Course must have a name',
					undefined,
					0, 'name'
				)
			)
		}

		// Check if the course has users
		if (this.users.length === 0) {
			response.add(
				new Error(
					'Course must have users',
					undefined,
					1, ''
				)
			)
		}

		// Check if the course has an admin
		else if (!this.users.some(user => user.permissions === Permissions.admin)) {
			response.add(
				new Error(
					'Course must have an admin',
					undefined,
					1, ''
				)
			)
		}

		// Validate the users
		for (const user of this.users) {
			response.add(user.validate())
		}

		return response
	}

	reduce(): SerializedCourse {
		/* Reduce the course to a POJO */

		return {
			code: this.code,
			name: this.name,
			users: this.users.map(user => user.reduce())
		}
	}

	save() {
		/* Save the course */
	}

	delete() {
		/* Delete the course */
	}
}
