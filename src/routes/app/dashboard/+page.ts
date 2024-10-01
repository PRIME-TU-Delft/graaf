
// Internal imports
import { ProgramController } from '$scripts/controllers'

// Load
export async function load({ data }) {
    const programs = await Promise.all(data.programs.map(program => ProgramController.revive(program)))
	return { programs }
}