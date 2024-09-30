
import { writable } from "svelte/store"
import type { GraphController } from "$scripts/controllers"
export const graph = writable<GraphController>()