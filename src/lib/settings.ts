type GridUnits = number;
type Pixels = number;
type Milliseconds = number;

// ------------------------> General settings

// Program settings
export const MAX_PROGRAM_NAME_LENGTH = 50;

// Course settings
export const COURSE_CODE_REGEX = /^[A-Za-z0-9]*$/;
export const MAX_COURSE_CODE_LENGTH = 255;
export const MAX_COURSE_NAME_LENGTH = 50;

// Graph settings
export const MAX_GRAPH_NAME_LENGTH = 50;
export const MAX_LINK_NAME_LENGTH = 12;

// Domain settings
export const MAX_DOMAIN_NAME_LENGTH = 50;

// Subject settings
export const MAX_SUBJECT_NAME_LENGTH = 50;

// Lecture settings
export const MAX_LECTURE_NAME_LENGTH = 50;

// ------------------------> Editor settings

// Grid settings
export const GRID_PADDING: GridUnits = 5;
export const GRID_UNIT: Pixels = 10;
export const GRID_COLOR = '#a4a4a4';

// Zoom settings
export const MIN_ZOOM = 0;
export const MAX_ZOOM = 1.5;
export const ZOOM_STEP = 1.5;

// Node settings
export const NODE_WIDTH: GridUnits = 16;
export const NODE_HEIGHT: GridUnits = 8;
export const NODE_MARGIN: GridUnits = 1.5;
export const NODE_PADDING: GridUnits = 1;

export const NODE_FONT_SIZE: Pixels = 15;
export const NODE_MAX_CHARS = 35;

export const NODE_HIGHLIGHT_DEVIATION: Pixels = 5;
export const NODE_HIGHLIGHT_OPACITY = 1;
export const NODE_HIGHLIGHT_COLOR = 'green';

// Stroke settings
export const STROKE_WIDTH: Pixels = 2;
export const STROKE_DASHARRAY = '10,5';

// Lecture settings
export const LECTURE_PADDING: GridUnits = 5;
export const LECTURE_HEADER_HEIGHT: GridUnits = 3;
export const LECTURE_COLUMN_WIDTH: GridUnits = 2 * LECTURE_PADDING + NODE_WIDTH;
export const LECTURE_FONT_SIZE: Pixels = 22;

// Overlay settings
export const OVERLAY_OPACITY = 0.5;

export const OVERLAY_BIG_FONT: Pixels = 30;
export const OVERLAY_SMALL_FONT: Pixels = 20;

export const OVERLAY_FADE_OUT: Milliseconds = 500;
export const OVERLAY_LINGER: Milliseconds = 1500;

// Simulation settings
export const CENTER_FORCE = 0.05;
export const CHARGE_FORCE = -15;

// Animation settings
export const GRAPH_ANIMATION_DURATION: Milliseconds = 500;

// Node style settings
const top = STROKE_WIDTH / 2;
const right = NODE_WIDTH * GRID_UNIT - STROKE_WIDTH / 2;
const bottom = NODE_HEIGHT * GRID_UNIT - STROKE_WIDTH / 2;
const left = STROKE_WIDTH / 2;
const hmid = (NODE_WIDTH * GRID_UNIT) / 2;
const vmid = (NODE_HEIGHT * GRID_UNIT) / 2;

export const COLORS = {
	PROSPEROUS_RED: '#e6362a',
	ENERGIZING_ORANGE: '#ff6c2f',
	SUNNY_YELLOW: '#f1c21b',
	ELECTRIC_GREEN: '#50d691',
	CONFIDENT_TURQUOISE: '#009da5',
	MYSTERIOUS_BLUE: '#3255a4',
	MAJESTIC_PURPLE: '#ae5171',
	POWERFUL_PINK: '#f87089',
	NEUTRAL_GRAY: '#91999f',
	SERIOUS_BROWN: '#563d29'
};

export const COLOR_KEYS = Object.keys(COLORS) as (keyof typeof COLORS)[];

export const DEFAULT_STYLE = {
	display_name: 'Default',
	stroke: '#000000',
	fill: '#ffffff',
	path: `M ${left} ${top}
			 L ${right} ${top}
			 L ${right} ${bottom}
			 L ${left} ${bottom}
			 Z`
};

export const STYLES = {
	PROSPEROUS_RED: {
		display_name: 'Prosperous Red',
		stroke: COLORS.PROSPEROUS_RED,
		fill: '#fad7d4',
		path: `M ${left} ${top}
				 L ${hmid} ${top + GRID_UNIT}
				 L ${right} ${top}
				 L ${right} ${bottom}
				 L ${hmid} ${bottom - GRID_UNIT}
				 L ${left} ${bottom}
				 Z`
	},

	ENERGIZING_ORANGE: {
		display_name: 'Energizing Orange',
		stroke: COLORS.ENERGIZING_ORANGE,
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

	SUNNY_YELLOW: {
		display_name: 'Sunny Yellow',
		stroke: COLORS.SUNNY_YELLOW,
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

	ELECTRIC_GREEN: {
		display_name: 'Electric Green',
		stroke: COLORS.ELECTRIC_GREEN,
		fill: '#dcf7e9',
		path: `M ${left} ${bottom}
				 Q ${left + 2 * GRID_UNIT} ${vmid} ${left} ${top}
				 L ${right} ${top}
				 Q ${right - 2 * GRID_UNIT} ${vmid} ${right} ${bottom}
				 Z`
	},

	CONFIDENT_TURQUOISE: {
		display_name: 'Confident Turquoise',
		stroke: COLORS.CONFIDENT_TURQUOISE,
		fill: '#ccebed',
		path: `M ${left} ${top}
				 L ${right} ${top}
				 L ${right} ${bottom}
				 L ${left} ${bottom}
				 Z`
	},

	MYSTERIOUS_BLUE: {
		display_name: 'Mysterious Blue',
		stroke: COLORS.MYSTERIOUS_BLUE,
		fill: '#d6dded',
		path: `M ${left + GRID_UNIT} ${bottom}
				 Q ${left - GRID_UNIT} ${vmid} ${left + GRID_UNIT} ${top}
				 L ${right - GRID_UNIT} ${top}
				 Q ${right + GRID_UNIT} ${vmid} ${right - GRID_UNIT} ${bottom}
				 Z`
	},

	MAJESTIC_PURPLE: {
		display_name: 'Majestic Purple',
		stroke: COLORS.MAJESTIC_PURPLE,
		fill: '#efdce3',
		path: `M ${left + GRID_UNIT} ${top}
				 L ${right - GRID_UNIT} ${top}
				 L ${right} ${vmid}
				 L ${right - GRID_UNIT} ${bottom}
				 L ${left + GRID_UNIT} ${bottom}
				 L ${left} ${vmid}
				 Z`
	},

	POWERFUL_PINK: {
		display_name: 'Powerful Pink',
		stroke: COLORS.POWERFUL_PINK,
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

	NEUTRAL_GRAY: {
		display_name: 'Neutral Gray',
		stroke: COLORS.NEUTRAL_GRAY,
		fill: '#d6d6d6',
		path: `M ${left} ${top + GRID_UNIT}
				 L ${hmid} ${top}
				 L ${right} ${top + GRID_UNIT}
				 L ${right} ${bottom - GRID_UNIT}
				 L ${hmid} ${bottom}
				 L ${left} ${bottom - GRID_UNIT}
				 Z`
	},

	SERIOUS_BROWN: {
		display_name: 'Serious Brown',
		stroke: COLORS.SERIOUS_BROWN,
		fill: '#d7cec7',
		path: `M ${left} ${top}
				 L ${right} ${top}
				 L ${right - GRID_UNIT} ${vmid}
				 L ${right} ${bottom}
				 L ${left} ${bottom}
				 L ${left + GRID_UNIT} ${vmid}
				 Z`
	}
};
