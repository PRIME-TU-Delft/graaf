
import * as uuid from 'uuid'

// Internal imports
import { ValidationData, Error } from "./ValidationData"
import { DropdownOption } from "./DropdownOption"

// Exports
export { Course, AssignedUser }
export type { Permissions, CourseData, AssignedUserData }


// --------------------> Types

type AssignedUserData = {
	name: string,
	permissions: string
}

type CourseData = {
	code: string,
	name: string,
	users: AssignedUserData[]

}

enum Permissions {
	read,
	write,
	admin
}


// --------------------> Classes


class AssignedUser {
	constructor(
		public course: Course,
		public uuid: string,
		public index: number,
		public name: string = '',
		public permissions?: Permissions
	) { }

	static create(course: Course) {
		/* Create a new assigned user */

		const user = new AssignedUser(
			course,
			uuid.v4(),
			course.users.length
		)
		course.users.push(user)
		return user
	}

	validate(): ValidationData {
		/* Validate the assigned user */

		const response = new ValidationData()

		// Check if the user name is valid
		if (this.name === '') {
			response.add(
				new Error(
					'User must have a name',
					undefined,
					1, this.uuid
				)
			)
		}

		// Check if the user has permissions
		if (this.permissions === undefined) {
			response.add(
				new Error(
					'User must have permissions',
					undefined,
					1, this.uuid
				)
			)
		}

		return response
	}

	reduce(): AssignedUserData {
		/* Reduce the assigned user to a POJO */

		return {
			name: this.name,
			permissions: Permissions[this.permissions!]
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

	static revive(data: CourseData) {
		/* Load the course from a POGO */

		const course = new Course(data.code, data.name)
		for (const user_data of data.users) {
			const user = AssignedUser.create(course)
			user.name = user_data.name
			user.permissions = Permissions[user_data.permissions as keyof typeof Permissions]
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

	reduce(): CourseData {
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
