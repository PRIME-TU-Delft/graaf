
// External dependencies
import { writable } from 'svelte/store'

// Internal dependencies
import {
    type ProgramController,
    type CourseController,
    type ControllerCache
} from '$scripts/controllers'

// Stores
export const programs = writable<ProgramController[]>([])
export const courses = writable<CourseController[]>([])
export const query = writable<string>('')