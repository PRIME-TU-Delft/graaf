
// Internal imports
import { ProgramController } from '$scripts/controllers'

// Load
export const load = async ({ data }) => {
	return {
        programs: await Promise.all(data.programs.map(program => ProgramController.revive(program)))
    }
}