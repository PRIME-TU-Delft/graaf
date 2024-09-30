
import { writable } from "svelte/store"
import type { CourseController } from "$scripts/controllers"
export const course = writable<CourseController>()