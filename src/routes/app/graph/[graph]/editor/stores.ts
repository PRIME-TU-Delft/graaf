// External dependencies
import { writable } from 'svelte/store';

// Internal dependencies
import type { GraphController } from '$scripts/controllers';
import type SaveStatus from '$components/SaveStatus.svelte';

// Exports
export const graph = writable<GraphController>();
export const save_status = writable<SaveStatus>();
export const domain_query = writable<string>('');
export const subject_query = writable<string>('');
export const lecture_query = writable<string>('');
