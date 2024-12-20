
import type SaveStatus from "$components/SaveStatus.svelte"

// --------------------> Types

interface IWithID<ID> {
	id: ID
}

export type UpdateArray<ID> = { connect?: { id: ID }[], disconnect?: { id: ID }[] }
export type UpdateRequiredField<ID> = {} | { connect: { id: ID }, disconnect: { id: ID } }
export type UpdateOptionalField<ID> = { connect?: { id: ID }, disconnect?: { id: ID } }

// --------------------> Utility Functions

export function oxfordCommaList(list: string[]): string {
	if (list.length === 0) {
		return ''
	} else if (list.length === 1) {
		return list[0]
	} else if (list.length === 2) {
		return `${list[0]} and ${list[1]}`
	} else {
		const last = list.pop()
		return `${list.join(', ')}, and ${last}`
	}
}

export function customError(name: string, message: string): Error {
	const error = new Error(message)
	error.name = name
	return error
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(callback: T, delay: number): (...args: Parameters<T>) => Promise<void> {
	let timeout: NodeJS.Timeout | undefined
	let resolvers: (() => void)[] = []

	return function (this: ThisParameterType<T>, ...args: Parameters<T>): Promise<void> {
		clearTimeout(timeout)

		return new Promise(resolve => {
			resolvers.push(resolve)
			timeout = setTimeout(async () => {
				await callback.apply(this, args)
				resolvers.forEach(resolve => resolve())
				timeout = undefined
				resolvers = []
			}, delay)
		})
	}
}

export function handleError(error: any, save_status?: SaveStatus) {
	const name = error instanceof Error ? error.name : 'UnknownError'
	const message = error instanceof Error ? error.message : error
	console.error(`${name}: ${message}`)
	save_status?.setError(`${name}: ${message}`)
}

export async function asyncFlatmap<Input, Output>(input: Input[], callback: (input: Input) => Output | Output[] | Promise<Output | Output[]>): Promise<Output[]> {
	const outputs = await Promise.all(input.map(callback))
	const result: Output[] = []
	
	for (const output of outputs) {
		if (Array.isArray(output)) {
			for (const item of output) {
				result.push(item)
			}
		} else {
			result.push(output)
		}
	}

	return result
}

export async function asyncConcat<T>(...items: (T | T[] | Promise<T | T[]>)[]): Promise<T[]> {
	const donators = await Promise.all(items)
	const result: T[] = []

	for (const donator of donators) {
		if (Array.isArray(donator)) {
			for (const item of donator) {
				result.push(item)
			}
		} else {
			result.push(donator)
		}
	}

	return result
}

export function compareArrays<T>(a: T[], b: T[]): boolean {

	// Test if the arrays are the same length
	let N = a.length
	if (N !== b.length) {
		return false
	}

	// Count the elements of the first array
	let hash = new Map<T, number>()
	for (let i = 0; i < N; i++) {
		let count = hash.get(a[i]) || 0
		hash.set(a[i], count + 1)
	}

	// Compare the elements of the second array
	for (let i = 0; i < N; i++) {
		let count = hash.get(b[i])
		if (count === undefined) {
			return false
		}

		if (count === 1) {
			hash.delete(b[i])
		} else {
			hash.set(b[i], count - 1)
		}
	}

	// If the arrays are equal, the hash should be empty
	return true
}

export function prismaUpdateArray<ID extends number | string, T extends IWithID<ID>>(prev?: (T | ID)[], next?: (T | ID)[]): UpdateArray<ID> {

	// Handle undefined cases
	if (prev === undefined || next === undefined) {
		return {}
	}

	// Map to objects
	const mapped_prev = prev.map(item =>
		typeof item === 'number' || typeof item === 'string'
			? { id: item }
			: { id: item.id }
	)

	const mapped_next = next.map(item =>
		typeof item === 'number' || typeof item === 'string'
			? { id: item }
			: { id: item.id }
	)

	// Easy cases
	if (prev.length === 0 && next.length === 0)
		return {}
	if (prev.length === 0)
		return { connect: mapped_next }
	if (next.length === 0)
		return { disconnect: mapped_prev }

	// Regular case
	const connect = mapped_next
		.filter(next_item => !mapped_prev.some(prev_item => prev_item.id === next_item.id))
	const disconnect = mapped_prev
		.filter(prev_item => !mapped_next.some(next_item => next_item.id === prev_item.id))

	const result: UpdateArray<ID> = {}
	if (connect.length)
		result.connect = connect
	if (disconnect.length)
		result.disconnect = disconnect

	return result
}

export function prismaUpdateRequiredField<ID extends number | string, T extends IWithID<ID>>(prev?: T | ID, next?: T | ID): UpdateRequiredField<ID> {

	// Handle undefined cases
	if (prev === undefined || next === undefined) {
		return {}
	}

	// Map to objects
	const mapped_prev = typeof prev === 'number' || typeof prev === 'string'
		? { id: prev }
		: { id: prev.id }

	const mapped_next = typeof next === 'number' || typeof next === 'string'
		? { id: next }
		: { id: next.id }

	// Easy case
	if (mapped_prev.id === mapped_next.id) {
		return {}
	}

	// Regular case
	return {
		connect: mapped_next,
		disconnect: mapped_prev
	}
}

export function prismaUpdateOptionalField<ID extends number | string, T extends IWithID<ID>>(prev?: T | ID | null, next?: T | ID | null): UpdateOptionalField<ID> {

	// Handle undefined cases
	if (prev === undefined || next === undefined) {
		return {}
	}

	// Map to objects
	const mapped_prev = prev === null
		? null
		: typeof prev === 'number' || typeof prev === 'string'
			? { id: prev }
			: { id: prev.id }

	const mapped_next = next === null
		? null
		: typeof next === 'number' || typeof next === 'string'
			? { id: next }
			: { id: next.id }
	

	// Easy cases
	if (mapped_prev === null && mapped_next === null)
		return {}
	if (mapped_prev === null && mapped_next !== null)
		return { connect: mapped_next }
	if (mapped_prev !== null && mapped_next === null)
		return { disconnect: mapped_prev }
	if (mapped_prev!.id === mapped_next!.id)
		return {}

	// Regular case
	return {
		connect: mapped_next!,
		disconnect: mapped_prev!
	}
}