
export enum Severity {
	success,
	warning,
	error
}

export type Violation = {
	severity: Severity,
	short: string,
	long?: string,
	url?: string,
	uuid?: string,
	suppressor?: () => void
}

export class Validation {
	severity: Severity = Severity.success
	errors: Violation[] = []
	warnings: Violation[] = []
	total_violations: number = 0

	add(item: Violation): void
	add(item: Validation): void
	add(item: Violation | Validation) {
		if (item instanceof Validation) {
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
		return new Validation()
	}

	static warning(short: string, long?: string, url?: string, uuid?: string, suppressor?: () => void) {
		const validation = new Validation()
		validation.add({
			severity: Severity.warning,
			short,
			long,
			url,
			uuid,
			suppressor
		})

		return validation
	}

	static error(short: string, long?: string, url?: string, uuid?: string, suppressor?: () => void) {
		const validation = new Validation()
		validation.add({
			severity: Severity.error,
			short,
			long,
			url,
			uuid,
			suppressor
		})

		return validation
	}
}