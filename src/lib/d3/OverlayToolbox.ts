import * as settings from '$lib/settings';
import type { D3 } from './D3';

export { OverlayToolbox };

// -----------------------------> Classes

class OverlayToolbox {
	static clear(d3: D3) {
		d3.overlay
			.interrupt()
			.attr('class', null)
			.style('opacity', 1)
			.style('pointer-events', 'all')
			.selectAll('*')
			.remove();
	}

	static error(d3: D3) {
		OverlayToolbox.clear(d3);

		d3.overlay
			.attr('class', 'error')
			.append('rect')
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('fill', 'white');

		const text = d3.overlay.append('text');
		text
			.append('tspan')
			.text('Oops!')
			.attr('x', '50%')
			.attr('y', '50%')
			.attr('font-size', settings.OVERLAY_BIG_FONT)
			.attr('dominant-baseline', 'middle')
			.attr('text-anchor', 'middle')
			.attr('fill', 'white');

		text
			.append('tspan')
			.text('An error occured rendering this graph')
			.attr('x', '50%')
			.attr('y', '50%')
			.attr('dy', settings.OVERLAY_BIG_FONT)
			.attr('font-size', settings.OVERLAY_SMALL_FONT)
			.attr('dominant-baseline', 'middle')
			.attr('text-anchor', 'middle')
			.style('cursor', 'pointer')
			.attr('fill', 'white');
	}

	static zoom(d3: D3) {
		if (!d3.overlay.classed('zoom')) {
			OverlayToolbox.clear(d3);

			d3.overlay
				.attr('class', 'zoom')
				.append('rect')
				.attr('width', '100%')
				.attr('height', '100%')
				.attr('background-color', 'black')
				.style('opacity', settings.OVERLAY_OPACITY);

			const text = d3.overlay.append('text');
			text
				.append('tspan')
				.text('Shift + Scroll to zoom')
				.attr('x', '50%')
				.attr('y', '50%')
				.attr('font-size', settings.OVERLAY_BIG_FONT)
				.attr('dominant-baseline', 'middle')
				.attr('text-anchor', 'middle')
				.attr('fill', 'white');

			text
				.append('tspan')
				.text('disable this')
				.attr('x', '50%')
				.attr('y', '50%')
				.attr('dy', settings.OVERLAY_BIG_FONT)
				.attr('font-size', settings.OVERLAY_SMALL_FONT)
				.attr('text-decoration', 'underline')
				.attr('dominant-baseline', 'middle')
				.attr('text-anchor', 'middle')
				.style('cursor', 'pointer')
				.attr('fill', 'white')
				.on('click', () => {
					d3.zoom_lock = false;
					OverlayToolbox.clear(d3);
				});
		}

		d3.overlay
			.interrupt()
			.style('opacity', 1)
			.transition()
			.duration(settings.OVERLAY_FADE_OUT)
			.delay(settings.OVERLAY_LINGER)
			.style('opacity', 0)
			.on('end', () => {
				OverlayToolbox.clear(d3);
			});
	}
}
