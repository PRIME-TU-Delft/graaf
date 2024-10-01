
// Internal imports
import { ProgramHelper } from '$scripts/helpers'

// Load
export async function load() {
	const programs = await ProgramHelper.getAll()
	return { programs }
}
