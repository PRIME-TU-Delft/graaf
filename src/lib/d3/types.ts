import * as d3 from 'd3';

import * as settings from '$lib/settings';

export { NodeType };
export type {
	GraphCanvas,
	NodePositions,
	PositionSink,
	GraphData,
	NodeData,
	EdgeData,
	LectureData,
	CameraTransform,
	SVGSelection,
	DefsSelection,
	GroupSelection,
	NodeSelection,
	EdgeSelection
};

// -----------------------------> Enums

/** Distinguishes a domain node from a subject node in the flattened GraphData/NodeData shapes. */
enum NodeType {
	DOMAIN = 'domain',
	SUBJECT = 'subject'
}

// -----------------------------> Types

/**
 * The flattened, simulation-ready shape of a graph's contents, as produced by
 * projectGraphData from the graph store's model. Domains and subjects are kept as separate
 * node/edge lists (rather than merged) since only one of the two is rendered at a time,
 * depending on the active view.
 */
type GraphData = {
	domain_nodes: NodeData[];
	domain_edges: EdgeData[];
	subject_nodes: NodeData[];
	subject_edges: EdgeData[];
	lectures: LectureData[];
};

/**
 * A single renderable node (a domain or a subject) in the D3 simulation. `x`/`y` are the node's
 * current position; `fx`/`fy` are D3's fixed-position fields, set while the node is not free to
 * move in the simulation (see NodeToolbox.setFixed).
 */
type NodeData = {
	id: number;
	uuid: string;
	type: NodeType;
	style: keyof typeof settings.STYLES | null;
	text: string;
	x: number;
	y: number;

	// Parent domain - used for subjects
	parent?: NodeData;

	// Fixed position - used for simulation
	fx?: number;
	fy?: number;
};

/**
 * A directed relation between two nodes (both domains or both subjects). Holds the actual node
 * objects rather than ids, so renderers can read source/target position and style directly.
 *
 * INVARIANT: `source` and `target` are reference-equal to the matching entries of the
 * `domain_nodes` / `subject_nodes` array they belong to. Edge geometry and styling read straight
 * through these references, and only the node objects in those arrays are kept up to date by the
 * simulation and the drag handler. `projectGraphData` is the one place these references are
 * created; see the invariant documented there before building an EdgeData anywhere else.
 */
type EdgeData = {
	uuid: string;
	source: NodeData;
	target: NodeData;
};

/**
 * A single lecture's rendering data, as produced by projectGraphData. `past_nodes`/
 * `present_nodes`/`future_nodes` partition the subject graph relative to this lecture's own
 * subjects (present_nodes), found by walking one hop outward along subject edges; `nodes`/
 * `edges` are the union of all three groups, used when rendering the lectures view.
 */
type LectureData = {
	id: number;
	name: string;
	past_nodes: NodeData[]; // Subjects required for this lecture
	present_nodes: NodeData[]; // Subjects covered in this lecture
	future_nodes: NodeData[]; // Subjects that will follow this lecture

	domains: NodeData[]; // Domains covered in this lecture
	nodes: NodeData[]; // All nodes in this lecture
	edges: EdgeData[]; // All edges in this lecture
};

/**
 * A camera position and zoom level: `x`/`y` are the point (in grid units) the camera is centered
 * on, `k` is the zoom scale factor. See CameraToolbox for how these are computed and applied.
 */
type CameraTransform = {
	x: number;
	y: number;
	k: number;
};

// D3 selection types, named for what they select: the root <svg>, the <defs> definitions layer,
// a generic <g> group (background/content/overlay), and typed selections of node groups / edge
// lines bound to NodeData / EdgeData respectively.
type SVGSelection = d3.Selection<SVGSVGElement, unknown, null, unknown>;
type DefsSelection = d3.Selection<SVGDefsElement, unknown, null, unknown>;
type GroupSelection = d3.Selection<SVGGElement, unknown, null, unknown>;
type NodeSelection = d3.Selection<SVGGElement, NodeData, d3.BaseType, unknown>;
type EdgeSelection = d3.Selection<SVGLineElement, EdgeData, d3.BaseType, unknown>;

// -----------------------------> Canvas ports
// The canvas is imperative and the graph store is reactive, so they meet through these two narrow
// types rather than importing each other.

/** What the graph store needs from a mounted canvas: somewhere to push a new projection, and a
 * slot to hand itself to as the canvas's position sink. Implemented by GraphD3. */
type GraphCanvas = {
	positionSink: PositionSink | null;
	applyData(data: GraphData, options?: { recenter?: boolean }): void;
};

/** Node positions the canvas has moved and wants persisted, split by kind since domains and
 * subjects are stored (and PATCHed) separately. */
type NodePositions = {
	domains: { id: number; x: number; y: number }[];
	subjects: { id: number; x: number; y: number }[];
};

/** Where the canvas sends the positions it has moved. Implemented by the graph store, which owns
 * both the rows they belong to and the request that persists them. */
type PositionSink = {
	persistPositions(positions: NodePositions): void;
};
