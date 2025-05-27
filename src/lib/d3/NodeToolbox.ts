import * as d3 from 'd3';
import * as settings from '$lib/settings';

import { EdgeToolbox } from './EdgeToolbox';
import { graphState } from './GraphD3State.svelte';
import { graphView } from './GraphD3View.svelte';

import type { GraphD3 } from './GraphD3';
import { NodeType, type EdgeData, type NodeData, type NodeSelection } from './types';
import { toast } from 'svelte-sonner';

export { NodeToolbox };

// -----------------------------> Classes

class NodeToolbox {
	static init(graph: GraphD3) {
		const filter = graph.definitions.select('filter#highlight');
		if (!filter.empty()) {
			return;
		}

		graph.definitions
			.append('filter')
			.attr('id', 'highlight')
			.append('feDropShadow')
			.attr('dx', 0)
			.attr('dy', 0)
			.attr('stdDeviation', settings.NODE_HIGHLIGHT_DEVIATION)
			.attr('flood-opacity', settings.NODE_HIGHLIGHT_OPACITY)
			.attr('flood-color', settings.NODE_HIGHLIGHT_COLOR);
	}

	static create(selection: NodeSelection, graph: GraphD3) {
		const styleOf = (node: NodeData) =>
			node.style ? settings.STYLES[node.style] : settings.DEFAULT_STYLE;

		// Node attributes
		selection
			.attr('id', (node) => node.uuid)
			.attr('class', 'node fixed')
			.attr(
				'transform',
				(node) => `translate(
                ${node.x * settings.GRID_UNIT},
                ${node.y * settings.GRID_UNIT}
            )`
			);

		// Node outline
		selection
			.append('path')
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('stroke', (node) => styleOf(node).stroke)
			.attr('fill', (node) => styleOf(node).fill)
			.attr('d', (node) => styleOf(node).path);

		// Node text
		selection
			.append('text')
			.text((node) => node.text)
			.style('text-anchor', 'middle')
			.style('dominant-baseline', 'middle')
			.style('font-size', settings.NODE_FONT_SIZE)
			.call(NodeToolbox.wrapText);

		// Drag behaviour
		selection.call(
			d3
				.drag<SVGGElement, NodeData>()
				.filter(() => NodeToolbox.allowNodeDrag(graph))
				.on('start', function () {
					const selection = d3.select<SVGGElement, NodeData>(this);
					selection.call(NodeToolbox.setFixed, graph, true);

					// Stop simulation if there are no unfixed nodes
					const unfixed = graph.content.selectAll<SVGGElement, NodeData>('.node:not(.fixed)')
					if (unfixed.empty()) {
						console.log('Stopping simulation due to fixed nodes');
						graph.stopSimulation();
					}
				})

				.on('drag', function (event, node) {
					const selection = d3.select<SVGGElement, NodeData>(this);
					node.x = node.x + event.dx / settings.GRID_UNIT;
					node.y = node.y + event.dy / settings.GRID_UNIT;
					node.fx = node.x;
					node.fy = node.y;

					NodeToolbox.updatePosition(selection, graph);

					// Excite simulation if it is running
					if (graphState.isSimulating()) {
						graph.simulation.alpha(1).restart();
					}
				})

				.on('end', async function (_, node) {
					const selection = d3.select<SVGGElement, NodeData>(this);
					node.x = Math.round(node.x);
					node.y = Math.round(node.y);
					node.fx = node.x;
					node.fy = node.y;

					NodeToolbox.updatePosition(selection, graph);
					NodeToolbox.save(selection);
				})
		);
	}

	static async save(selection: NodeSelection) {
		// We are not guaranteed to select only domains, or only subjects, so we have two options:
		// 1) Send an API call per node, to the appropriate endpoint => More requests, less work per request
		// 2) Sort the nodes by type and send a single API call per type => Fewer requests, more work per request
		// We will go with option 2 for now, as save isnt called often (only on drag-end and simulation-end)
		// and this offloads some work from the server

		console.log(`Saving ${selection.size()} nodes`)

		// Group nodes by type
		const domains = selection.filter((node) => node.type === NodeType.DOMAIN).data();
		const subjects = selection.filter((node) => node.type === NodeType.SUBJECT).data();

		// Send API calls
		const domainBody = domains.map((node) => ({ domainId: node.id, x: node.x, y: node.y }));
		const subjectBody = subjects.map((node) => ({ subjectId: node.id, x: node.x, y: node.y }));

		const requests = [
			fetch('/api/domains/position', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(domainBody)
			}),

			fetch('/api/subjects/position', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(subjectBody)
			})
		];

		const responses = await Promise.all(requests);
		if (responses.some((response) => !response.ok)) {
			toast.error('Failed to save node positions', { duration: 2000 });
		}
	}

	static updatePosition(selection: NodeSelection, graph: GraphD3, transition: boolean = false) {
		// Raise nodes
		selection.raise();

		// Update node position
		selection
			.transition()
			.duration(transition ? settings.GRAPH_ANIMATION_DURATION : 0)
			.ease(d3.easeSinInOut)
			.attr(
				'transform',
				(node) => `translate(
					${node.x * settings.GRID_UNIT},
					${node.y * settings.GRID_UNIT}
				)`
			);

		// Update edges
		selection.each(function (node) {
			graph.content
				.selectAll<SVGLineElement, EdgeData>('.edge')
				.filter((edge) => edge.source === node || edge.target === node)
				.call(EdgeToolbox.updatePosition, transition);
		});
	}

	static updateHighlight(selection: NodeSelection, graph: GraphD3) {
		selection.each(function (node) {
			const highlight =
				graph.lecture?.domains.includes(node) || graph.lecture?.present_nodes.includes(node);

			d3.select(this).attr('filter', highlight ? 'url(#highlight)' : null);
		});
	}

	static updateStyle(selection: NodeSelection) {
		const styleOf = (node: NodeData) =>
			node.style ? settings.STYLES[node.style] : settings.DEFAULT_STYLE;

		selection
			.select('path')
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('stroke', (node) => styleOf(node).stroke)
			.attr('fill', (node) => styleOf(node).fill)
			.attr('d', (node) => styleOf(node).path);
	}

	static updateText(selection: NodeSelection) {
		selection.select('text').remove();

		selection
			.append('text')
			.text((node) => node.text)
			.style('text-anchor', 'middle')
			.style('dominant-baseline', 'middle')
			.style('font-size', settings.NODE_FONT_SIZE)
			.call(NodeToolbox.wrapText);
	}

	static setFixed(selection: NodeSelection, graph: GraphD3, fixed: boolean) {
		selection
			.filter(fixed ? ':not(.fixed)' : '.fixed')
			.classed('fixed', fixed)
			.attr('stroke-dasharray', fixed ? null : settings.STROKE_DASHARRAY)
			.each((node) => {
				node.x = fixed ? Math.round(node.x) : node.x;
				node.y = fixed ? Math.round(node.y) : node.y;
				node.fx = fixed ? node.x : undefined;
				node.fy = fixed ? node.y : undefined;
			});

		NodeToolbox.updatePosition(selection, graph);
	}

	static wrapText(selection: d3.Selection<SVGTextElement, NodeData, d3.BaseType, unknown>) {
		// WARNING this function does not limit vertical text overflow.
		// It will keep adding lines until all text is displayed.
		// Currently this problem is mitigated by a character limit on the node text

		selection.each(function () {
			const max_width = (settings.NODE_WIDTH - 2 * settings.NODE_PADDING) * settings.GRID_UNIT;
			const vert_center = (settings.NODE_HEIGHT / 2) * settings.GRID_UNIT;
			const horz_center = (settings.NODE_WIDTH / 2) * settings.GRID_UNIT;

			// Select elements
			const element = d3.select(this);
			const text = element.text();
			const words = text.split(/\s+/);
			element.text(null);

			// Make tspan - This element is used to measure text length using getComputedTextLength()
			let tspan = element.append('tspan').attr('x', horz_center);

			// Get longest word - If this word is longer than the node, the font will be scaled down until it fits
			const longest = words.reduce((a, b) => (a.length > b.length ? a : b));
			tspan.text(longest);

			// Scale font size
			const scale = Math.min(1, max_width / tspan.node()!.getComputedTextLength());
			const font_size = settings.NODE_FONT_SIZE * scale;
			element.attr('font-size', font_size);

			// Wrap text
			let line_count = 0;
			let line: string[] = [];
			for (const word of words) {
				line.push(word);
				tspan.text(line.join(' '));

				// If the line is too long, add tspan to the element and start a new line
				if (tspan.node()!.getComputedTextLength() > max_width) {
					line.pop();
					tspan.text(line.join(' '));
					line = [word];
					tspan = element
						.append('tspan')
						.attr('x', horz_center)
						.attr('y', 0)
						.attr('dy', ++line_count * 1.1 + 'em') // NOTE assumes line height is 1.1em
						.text(word);
				}
			}

			// Center vertically
			element.selectAll('tspan').attr('y', vert_center - (font_size * line_count * 1.1) / 2); // NOTE assumes line height is 1.1emt
		});
	}

	static allowNodeDrag(graph: GraphD3): boolean {
		return (
			graph.editable &&
			(graphView.isDomains() || graphView.isSubjects()) &&
			(graphState.isIdle() || graphState.isSimulating())
		);
	}
}
