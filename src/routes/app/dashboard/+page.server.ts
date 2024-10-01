
import { ProgramHelper } from '$scripts/helpers'

export async function load() {
	const programs = await ProgramHelper.getAll()

	return {
		programs
	}
}
