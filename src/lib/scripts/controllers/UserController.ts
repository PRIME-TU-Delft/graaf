
// Internal imports
import type { SerializedUser } from "$scripts/types"

// Exports
export { UserController }


// --------------------> Classes


class UserController {
	constructor(
		public id: number,
		public netid: string,
		public first_name: string,
		public last_name: string,
        public role: string,
        public email?: string
	) { }

	reduce(): SerializedUser {
		/* Reduce the user to a POJO */

		return {
			id: this.id,
            netid: this.netid,
            first_name: this.first_name,
            last_name: this.last_name,
            role: this.role,
            email: this.email
		}
	}
}