// Runs before every unit test file, including ones that stay on the default node environment
// (where none of the globals below exist), so everything here is guarded.

// jsdom doesn't give <text>/<tspan> their own SVGTextElement/SVGTSpanElement prototypes, just the
// generic SVGElement - TS's DOM lib puts getComputedTextLength on SVGTextContentElement, which
// jsdom never instantiates, hence the cast.
const svgElementProto =
	typeof SVGElement !== 'undefined'
		? (SVGElement.prototype as unknown as {
				getComputedTextLength?: () => number;
			})
		: undefined;

if (svgElementProto && !svgElementProto.getComputedTextLength) {
	// jsdom doesn't implement layout, so text measurement APIs are unimplemented. NodeToolbox uses
	// this to size/wrap node labels; component tests just need a stable, deterministic value.
	svgElementProto.getComputedTextLength = function (this: Element) {
		return this.textContent?.length ?? 0;
	};
}

if (typeof SVGSVGElement !== 'undefined' && !('width' in SVGSVGElement.prototype)) {
	// jsdom has no layout engine, so it never implements the width/height SVGAnimatedLength IDL
	// properties. d3-zoom's default extent falls back to reading these when the target <svg> has
	// no viewBox attribute set; give it a fixed, arbitrary size so that lookup doesn't throw.
	Object.defineProperty(SVGSVGElement.prototype, 'width', {
		get: () => ({ baseVal: { value: 800 } }),
		configurable: true
	});
	Object.defineProperty(SVGSVGElement.prototype, 'height', {
		get: () => ({ baseVal: { value: 600 } }),
		configurable: true
	});
}

if (typeof Element !== 'undefined' && !Element.prototype.animate) {
	// jsdom doesn't implement the Web Animations API, which svelte/transition (used e.g. by
	// GraphDecorators' `transition:fade`) relies on to run and time intro/outro transitions. This
	// stand-in schedules `onfinish` after the requested duration with a real timer, matching
	// enough of the real Animation interface for svelte's transition runtime to drive through it.
	class FakeAnimation {
		currentTime = 0;
		playState: 'running' | 'finished' | 'idle' = 'running';
		effect: unknown = null;
		onfinish: (() => void) | null = null;
		private timer: ReturnType<typeof setTimeout>;

		constructor(duration: number) {
			this.timer = setTimeout(() => {
				this.currentTime = duration;
				this.playState = 'finished';
				this.onfinish?.();
			}, duration);
		}

		cancel() {
			clearTimeout(this.timer);
			this.playState = 'idle';
		}
	}

	Element.prototype.animate = function (
		this: Element,
		_keyframes: unknown,
		options: number | { duration?: number }
	) {
		const duration = typeof options === 'number' ? options : (options?.duration ?? 0);
		return new FakeAnimation(duration) as unknown as Animation;
	};
}

if (typeof SVGElement !== 'undefined' && !('transform' in SVGElement.prototype)) {
	// jsdom doesn't implement the `transform`/SVGAnimatedTransformList IDL property either.
	// d3-zoom's camera pan/zoom animations read it (via d3-interpolate's parseSvg) to interpolate
	// from an element's current transform; `consolidate()` returning null makes d3-interpolate
	// fall back to its identity transform instead of throwing, which is fine here since these
	// tests only care about which nodes are rendered, not their animated screen positions.
	Object.defineProperty(SVGElement.prototype, 'transform', {
		get: () => ({ baseVal: { consolidate: () => null } }),
		configurable: true
	});
}

if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
	// jsdom has no layout engine, so ResizeObserver (used by bits-ui's floating-ui positioning)
	// never fires. Component tests don't depend on real positioning, just a no-op stand-in.
	window.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
