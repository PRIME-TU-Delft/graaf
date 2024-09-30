
// Exports
export { User}
export type { SerializedUser }


// --------------------> Types


type ID = number

type SerializedUser = {
	id: ID,
	netid: string,
	first_name: string,
	last_name: string,
    role: string,
	email?: string
}


// --------------------> Classes


class User {
	constructor(
		public id: ID,
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