
// External dependencies
import { writable } from 'svelte/store'

// Internal dependencies
import type { DropdownOption } from '$scripts/types'

import type {
	ControllerCache,
	CourseController,
	ProgramController
} from '$scripts/controllers'

// Exports
export const cache = writable<ControllerCache | undefined>()
export const course = writable<CourseController | undefined>()
export const programs = writable<ProgramController[] | undefined>()
export const program_options = writable<DropdownOption<ProgramController>[] | undefined>()

course.subscribe(async course => programs.set(await course?.getPrograms()))
course.subscribe(async course => program_options.set(await course?.getProgramOptions()))