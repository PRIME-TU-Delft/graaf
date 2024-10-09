
// Exports
export { ValidationData, Severity }
export type { Violation }


// --------------------> Classes
 

enum Severity {
	success,
	warning,
	error
}

type Violation = {
	severity: Severity,
	short: string,
	long?: string,
	tab?: number,
	uuid?: string
}

class ValidationData {
	severity: Severity = Severity.success
	errors: Violation[] = []
	warnings: Violation[] = []
	total_violations: number = 0

	add(item: Violation | ValidationData) {
		if (item instanceof ValidationData) {
			this.errors.push(...item.errors)
			this.warnings.push(...item.warnings)
			this.total_violations += item.total_violations
		} 
		
		else {
			if (item.severity === Severity.error)
				this.errors.push(item)
			else if (item.severity === Severity.warning)
				this.warnings.push(item)
			this.total_violations++
		}

		if (item.severity > this.severity) {
			this.severity = item.severity
		}
	}

	static success() {
		return new ValidationData()
	}

	static warning(short: string, long?: string, tab?: number, uuid?: string) {
		const data = new ValidationData()
		data.add({
			severity: Severity.warning,
			short,
			long,
			tab,
			uuid
		})

		return data
	}

	static error(short: string, long?: string, tab?: number, uuid?: string) {
		const data = new ValidationData()
		data.add({
			severity: Severity.error,
			short,
			long,
			tab,
			uuid
		})

		return data
	}
}