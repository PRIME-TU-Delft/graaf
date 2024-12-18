// External dependencies
import { writable } from 'svelte/store';

// Internal dependencies
import type { ProgramController, CourseController } from '$scripts/controllers';

import type SaveStatus from '$components/SaveStatus.svelte';

// Exports
export const program = writable<ProgramController>();
export const save_status = writable<SaveStatus>();
export const courses = writable<CourseController[]>();
