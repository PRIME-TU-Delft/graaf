
// Exports
export { ValidationData, Error, Warning }


// --------------------> Classes


class ValidationData {
	errors: Error[] = []
	warnings: Warning[] = []

	get total_items(): number {
		return this.errors.length + this.warnings.length
	}

	get severity(): 'error' | 'warning' | 'success'  {
		if (this.errors.length > 0)
			return 'error'
		if (this.warnings.length > 0)
			return 'warning'
		return 'success'
	}

	add(item: Error | Warning | ValidationData) {
		if (item instanceof Error) {
			this.errors.push(item)
		} else if (item instanceof Warning) {
			this.warnings.push(item)
		} else if (item instanceof ValidationData) {
			this.errors.push(...item.errors)
			this.warnings.push(...item.warnings)
		}
	}
}

class Error {
	constructor (
		public short: string,
		public long?: string
	) { }
}

class Warning {
	constructor (
		public short: string,
		public long?: string
	) { }
}