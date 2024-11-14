
// External dependencies
import { writable } from 'svelte/store'

// Internal dependencies
import type { ProgramController } from '$scripts/controllers'

// Exports
export const program = writable<ProgramController>()