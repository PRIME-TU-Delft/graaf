
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { customError } from '$scripts/utility'

import {
	CourseHelper,
	ProgramHelper,
	UserHelper
} from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {
	const program_id = Number(params.program)
	if (isNaN(program_id))
		return Promise.reject('Invalid program ID')

	// Start data streams
	const program = ProgramHelper.getById(program_id, 'courses', 'editors', 'admins')
		.catch(error => { throw customError('ServerError', error) })
	const courses = CourseHelper.getAll()
		.catch(error => { throw customError('ServerError', error) })
	const users = UserHelper.getAll()
		.catch(error => { throw customError('ServerError', error) })

	return { program, courses, users }
}
