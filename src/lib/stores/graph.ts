
import { writable } from "svelte/store"
import type { Graph } from "$scripts/entities"
export const graph = writable<Graph>()