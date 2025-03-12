import * as settings from '$lib/settings';
import { EdgeToolbox } from './EdgeToolbox';
import { GraphD3 } from './GraphD3';

import { drag, select } from 'd3';
import type { D3 } from './D3';
import { graphState } from './GraphD3State.svelte';
import { graphView } from './GraphD3View.svelte';
import type { EdgeData, NodeData, NodeSelection } from './types';

export { NodeToolbox };

// -----------------------------> Classes

class NodeToolbox {
	static init(d3: D3) {
		const filter = d3.definitions.select('filter#highlight');
		if (!filter.empty()) {
			return;
		}

		d3.definitions
			.append('filter')
			.attr('id', 'highlight')
			.append('feDropShadow')
			.attr('dx', 0)
			.attr('dy', 0)
			.attr('stdDeviation', settings.NODE_HIGHLIGHT_DEVIATION)
			.attr('flood-opacity', settings.NODE_HIGHLIGHT_OPACITY)
			.attr('flood-color', settings.NODE_HIGHLIGHT_COLOR);
	}

	static create(selection: NodeSelection, d3: D3) {
		// Node attributes
		selection
			.attr('id', (node) => node.id)
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
			.attr('stroke', (node) => settings.NODE_STYLES[node.style].stroke)
			.attr('fill', (node) => settings.NODE_STYLES[node.style].fill)
			.attr('d', (node) => settings.NODE_STYLES[node.style].path);

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
			drag<SVGGElement, NodeData>()
				.filter(() => NodeToolbox.allowNodeDrag(d3))
				.on('start', function () {
					const selection = select<SVGGElement, NodeData>(this);
					selection.call(NodeToolbox.setFixed, d3, true);
				})

				.on('drag', function (event, node) {
					const selection = select<SVGGElement, NodeData>(this);
					node.x = node.x + event.dx / settings.GRID_UNIT;
					node.y = node.y + event.dy / settings.GRID_UNIT;
					node.fx = node.x;
					node.fy = node.y;

					NodeToolbox.updatePosition(selection, d3);

					if (graphState.isSimulating()) {
						d3.simulation.alpha(1).restart();
					}
				})

				.on('end', async function (_, node) {
					const selection = select<SVGGElement, NodeData>(this);
					node.x = Math.round(node.x);
					node.y = Math.round(node.y);
					node.fx = node.x;
					node.fy = node.y;

					NodeToolbox.updatePosition(selection, d3);
					NodeToolbox.save(selection);
				})
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static save(selection: NodeSelection) {
		// TODO NOT IMPLEMENTED
	}

	static updatePosition(selection: NodeSelection, d3: D3, transition: boolean = true) {
		// Raise nodes
		selection.raise();

		// TODO: check why this is called so

		// Update node position
		selection
			// .transition()
			// .duration(transition ? settings.GRAPH_ANIMATION_DURATION : 0)
			// .ease(easeSinInOut)
			.attr(
				'transform',
				(node) => `translate(
                ${node.x * settings.GRID_UNIT},
                ${node.y * settings.GRID_UNIT}
            )`
			);

		// Update edges
		selection.each(function (node) {
			d3.content
				.selectAll<SVGLineElement, EdgeData>('.edge')
				.filter((edge) => edge.source === node || edge.target === node)
				.call(EdgeToolbox.updatePosition, transition);
		});
	}

	static updateHighlight(selection: NodeSelection, graph: GraphD3) {
		selection.each(function (node) {
			const highlight =
				graph.lecture?.domains.includes(node) || graph.lecture?.present_nodes.includes(node);

			select(this).attr('filter', highlight ? 'url(#highlight)' : null);
		});
	}

	static setFixed(selection: NodeSelection, d3: D3, fixed: boolean) {
		selection
			.classed('fixed', fixed)
			.attr('stroke-dasharray', fixed ? null : settings.STROKE_DASHARRAY)
			.each((node) => {
				node.x = fixed ? Math.round(node.x) : node.x;
				node.y = fixed ? Math.round(node.y) : node.y;
				node.fx = fixed ? node.x : undefined;
				node.fy = fixed ? node.y : undefined;
			});

		NodeToolbox.updatePosition(selection, d3);
	}

	static wrapText(selection: d3.Selection<SVGTextElement, NodeData, d3.BaseType, unknown>) {
		selection.each(function () {
			const max_width = (settings.NODE_WIDTH - 2 * settings.NODE_PADDING) * settings.GRID_UNIT;
			const vert_center = (settings.NODE_HEIGHT / 2) * settings.GRID_UNIT;
			const horz_center = (settings.NODE_WIDTH / 2) * settings.GRID_UNIT;

			// Select elements
			const element = select(this);
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
			element.selectAll('tspan').attr('y', vert_center - (font_size * line_count * 1.1) / 2); // NOTE assumes line height is 1.1em

			// WARNING this function does not limit vertical text overflow.
			// It will keep adding lines until all text is displayed.
			// Currently this problem is mitigated by a character limit on the node text
		});
	}

	static allowNodeDrag(d3: D3): boolean {
		return (
			d3.graph.editable &&
			(graphView.isDomains() || graphView.isSubjects()) &&
			(graphState.isIdle() || graphState.isSimulating())
		);
	}
}
