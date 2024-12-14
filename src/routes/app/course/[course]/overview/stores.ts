
// External dependencies
import { writable } from 'svelte/store'

// Internal dependencies
import type { CourseController } from '$scripts/controllers'
import type SaveStatus from '$components/SaveStatus.svelte'

// Exports
export const course = writable<CourseController>()
export const save_status = writable<SaveStatus>()