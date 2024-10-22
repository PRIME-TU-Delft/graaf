
interface IWithID {
	id: number
}

export function array_delta<T extends IWithID>(prev: (T | number)[], next: (T | number)[]): { connect?: { id: number }[], disconnect?: { id: number }[] } {
   const prev_ids = prev.map(item => typeof item === 'number' ? { id: item } : { id: item.id })
   const next_ids = next.map(item => typeof item === 'number' ? { id: item } : { id: item.id })

	// Easy cases
	if (prev.length === 0 && next.length === 0)
		return {}
	if (prev.length === 0)
		return { connect: next_ids }
	if (next.length === 0)
		return { disconnect: prev_ids }

	// Regular case
	const connect = next_ids
		.filter(next_item => !prev_ids.some(prev_item => prev_item.id === next_item.id))
	const disconnect = prev_ids
		.filter(prev_item => !next_ids.some(next_item => next_item.id === prev_item.id))

	const result: { connect?: { id: number }[], disconnect?: { id: number }[] } = {}
	if (connect.length)
		result.connect = connect
	if (disconnect.length)
		result.disconnect = disconnect

	return result
}

export function required_field_delta<T extends IWithID>(prev: T | number, next: T | number): {} | { connect: { id: number }, disconnect: { id: number } } {
	const prev_id = typeof prev === 'number' ? prev : prev.id
	const next_id = typeof next === 'number' ? next : next.id

	// Easy case
	if (prev_id === next_id) {
		return {}
	}

	// Regular case
	return {
		connect: { id: next_id },
		disconnect: { id: prev_id }
	}
}

export function optional_field_delta<T extends IWithID>(prev: T | number | null, next: T | number | null): { connect?: { id: number }, disconnect?: { id: number } } {
	const prev_id = prev === null ? null : typeof prev === 'number' ? prev : prev.id
	const next_id = next === null ? null : typeof next === 'number' ? next : next.id

	// Easy cases
	if (prev_id === next_id)
		return {}
	if (prev_id === null && next_id !== null)
		return { connect: { id: next_id } }
	if (prev_id !== null && next_id === null) {
		return { disconnect: { id: prev_id } }
	}

	// Regular case
	return {
		connect: { id: next_id! },
		disconnect: { id: prev_id! }
	}
}