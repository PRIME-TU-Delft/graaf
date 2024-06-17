
// Internal imports
import { Domain, Subject } from './Fields'

// Exports
export { BoundingBox }


// --------------------> Classes


class BoundingBox {
	x: number
	y: number
	width: number
	height: number

	constructor(fields: (Domain | Subject)[]) {
		/* Create a bounding box around a list of fields */

		let min_x = Infinity
		let min_y = Infinity
		let max_x = -Infinity
		let max_y = -Infinity

		for (const field of fields) {
			min_x = Math.min(min_x, field.x)
			min_y = Math.min(min_y, field.y)
			max_x = Math.max(max_x, field.x)
			max_y = Math.max(max_y, field.y)
		}

		this.x = (max_x + min_x) / 2
		this.y = (max_y + min_y) / 2
		this.width = max_x - min_x
		this.height = max_y - min_y
	}
}
