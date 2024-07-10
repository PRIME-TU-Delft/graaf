
import { writable } from "svelte/store"
import type { Course } from "$scripts/entities"
export const course = writable<Course>()