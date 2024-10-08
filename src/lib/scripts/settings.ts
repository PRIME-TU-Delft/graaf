
type Scalar = number
type Pixels = number
type GridUnits = number
type Milliseconds = number

// Grid settings
export const GRID_COLOR = '#a4a4a4'
export const GRID_UNIT: Scalar = 10

// Zoom settings
export const MIN_ZOOM: Scalar = 0
export const MAX_ZOOM: Scalar = 1.5
export const ZOOM_STEP: Scalar = 1.5

// Field settings
export const FIELD_WIDTH: GridUnits  = 16
export const FIELD_HEIGHT: GridUnits = 8
export const FIELD_MARGIN: GridUnits = 1.5
export const FIELD_PADDING: GridUnits = 1
export const FIELD_FONT_SIZE: Pixels = 15
export const FIELD_MAX_CHARS: Scalar = 35
export const FIELD_HIGHLIGHT_DEVIATION: Pixels = 5
export const FIELD_HIGHLIGHT_OPACITY: Scalar = 0.75
export const FIELD_HIGHLIGHT_COLOR: string = 'green'

// Stroke settings
export const STROKE_WIDTH: Pixels = 2
export const STROKE_DASHARRAY: string  = '10,5'

// Lecture settings
export const LECTURE_PADDING: GridUnits = 5
export const LECTURE_HEADER_HEIGHT: GridUnits = 3
export const LECTURE_COLUMN_WIDTH: GridUnits = 2 * LECTURE_PADDING + FIELD_WIDTH
export const LECTURE_FONT_SIZE: Pixels = 22

// Overlay settings
export const OVERLAY_OPACITY: Scalar = 0.5
export const OVERLAY_BIG_FONT: Pixels = 30
export const OVERLAY_SMALL_FONT: Pixels = 20
export const OVERLAY_FADE_OUT: Milliseconds = 500
export const OVERLAY_LINGER: Milliseconds = 1500

// Animation settings
export const FADE_DURATION: Milliseconds = 500
export const ANIMATION_DURATION: Milliseconds = 1000
export const SHAKE = {
	delay: 150,
	keyframes: [
		{ transform: 'translate3d(0, 0, 0)'},
		{ transform: 'translate3d(-10px, 0, 0)'},
		{ transform: 'translate3d(8px, 0, 0)'},
		{ transform: 'translate3d(-6px, 0, 0)'},
		{ transform: 'translate3d(4px, 0, 0)'},
		{ transform: 'translate3d(-2px, 0, 0)'},
		{ transform: 'translate3d(0, 0, 0)'}
	],
	options: {
		duration: 400,
		easeing: 'cubic-bezier(.15,.5,.25,.95)',
	}
}

// Simulation settings
export const CENTER_FORCE: Scalar = 0.05
export const CHARGE_FORCE: Scalar = -15

const top = STROKE_WIDTH / 2
const right = FIELD_WIDTH * GRID_UNIT - STROKE_WIDTH / 2
const bottom = FIELD_HEIGHT * GRID_UNIT - STROKE_WIDTH / 2
const left = STROKE_WIDTH / 2
const hmid = (FIELD_WIDTH * GRID_UNIT) / 2
const vmid = (FIELD_HEIGHT * GRID_UNIT) / 2

export const styles: {
	[key: string]: { display_name: string, stroke: string, fill: string, path: string }
} = {
	'prosperous-red': {
		display_name: 'Prosperous Red',
		stroke: '#e6362a',
		fill: '#fad7d4',
		path: `M ${left} ${top}
				 L ${hmid} ${top + GRID_UNIT}
				 L ${right} ${top}
				 L ${right} ${bottom}
				 L ${hmid} ${bottom - GRID_UNIT}
				 L ${left} ${bottom}
				 Z`
	},

	'energizing-orange': {
		display_name: 'Energizing Orange',
		stroke: '#ff6c2f',
		fill: '#ffe2d5',
		path: `M ${left} ${top + GRID_UNIT}
				 L ${left + GRID_UNIT} ${top + GRID_UNIT}
				 L ${left + GRID_UNIT} ${top}
				 L ${right - GRID_UNIT} ${top}
				 L ${right - GRID_UNIT} ${top + GRID_UNIT}
				 L ${right} ${top + GRID_UNIT}
				 L ${right} ${bottom - GRID_UNIT}
				 L ${right - GRID_UNIT} ${bottom - GRID_UNIT}
				 L ${right - GRID_UNIT} ${bottom}
				 L ${left + GRID_UNIT} ${bottom}
				 L ${left + GRID_UNIT} ${bottom - GRID_UNIT}
				 L ${left} ${bottom - GRID_UNIT}
				 Z`
	},

	'sunny-yellow': {
		display_name: 'Sunny Yellow',
		stroke: '#f1c21b',
		fill: '#fff2cc',
		path: `M ${left} ${top + 2 * GRID_UNIT}
				 A ${2 * GRID_UNIT} ${2 * GRID_UNIT} 0 0 1 ${left + 2 * GRID_UNIT} ${top}
				 L ${right - 2 * GRID_UNIT} ${top}
				 A ${2 * GRID_UNIT} ${2 * GRID_UNIT} 0 0 1 ${right} ${top + 2 * GRID_UNIT}
				 L ${right} ${bottom - 2 * GRID_UNIT}
				 A ${2 * GRID_UNIT} ${2 * GRID_UNIT} 0 0 1 ${right - 2 * GRID_UNIT} ${bottom}
				 L ${left + 2 * GRID_UNIT} ${bottom}
				 A ${2 * GRID_UNIT} ${2 * GRID_UNIT} 0 0 1 ${left} ${bottom - 2 * GRID_UNIT}
				 Z`
	},

	'electric-green': {
		display_name: 'Electric Green',
		stroke: '#50d691',
		fill: '#dcf7e9',
		path: `M ${left} ${bottom}
				 Q ${left + 2 * GRID_UNIT} ${vmid} ${left} ${top}
				 L ${right} ${top}
				 Q ${right - 2 * GRID_UNIT} ${vmid} ${right} ${bottom}
				 Z`
	},

	'confident-turquoise': {
		display_name: 'Confident Turquoise',
		stroke: '#009da5',
		fill: '#ccebed',
		path: `M ${left} ${top}
				 L ${right} ${top}
				 L ${right} ${bottom}
				 L ${left} ${bottom}
				 Z`
	},

	'mysterious-blue': {
		display_name: 'Mysterious Blue',
		stroke: '#3255a4',
		fill: '#d6dded',
		path: `M ${left + GRID_UNIT} ${bottom}
				 Q ${left - GRID_UNIT} ${vmid} ${left + GRID_UNIT} ${top}
				 L ${right - GRID_UNIT} ${top}
				 Q ${right + GRID_UNIT} ${vmid} ${right - GRID_UNIT} ${bottom}
				 Z`
	},

	'majestic-purple': {
		display_name: 'Majestic Purple',
		stroke: '#ae5171',
		fill: '#efdce3',
		path: `M ${left + GRID_UNIT} ${top}
				 L ${right - GRID_UNIT} ${top}
				 L ${right} ${vmid}
				 L ${right - GRID_UNIT} ${bottom}
				 L ${left + GRID_UNIT} ${bottom}
				 L ${left} ${vmid}
				 Z`
	},

	'powerful-pink': {
		display_name: 'Powerful Pink',
		stroke: '#f87089',
		fill: '#fee2e7',
		path: `M ${left} ${top + 2 * GRID_UNIT}
				 L ${left + 2 * GRID_UNIT} ${top}
				 L ${right - 2 * GRID_UNIT} ${top}
				 L ${right} ${top + 2 * GRID_UNIT}
				 L ${right} ${bottom - 2 * GRID_UNIT}
				 L ${right - 2 * GRID_UNIT} ${bottom}
				 L ${left + 2 * GRID_UNIT} ${bottom}
				 L ${left} ${bottom - 2 * GRID_UNIT}
				 Z`
	},

	'neutral-gray': {
		display_name: 'Neutral Gray',
		stroke: '#91999f',
		fill: '#d6d6d6',
		path: `M ${left} ${top + GRID_UNIT}
				 L ${hmid} ${top}
				 L ${right} ${top + GRID_UNIT}
				 L ${right} ${bottom - GRID_UNIT}
				 L ${hmid} ${bottom}
				 L ${left} ${bottom - GRID_UNIT}
				 Z`
	},

	'serious-brown': {
		display_name: 'Serious Brown',
		stroke: '#563d29',
		fill: '#d7cec7',
		path: `M ${left} ${top}
				 L ${right} ${top}
				 L ${right - GRID_UNIT} ${vmid}
				 L ${right} ${bottom}
				 L ${left} ${bottom}
				 L ${left + GRID_UNIT} ${vmid}
				 Z`
	}
}
