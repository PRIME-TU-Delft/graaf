/**
 * Tracks the graph canvas's current activity state as Svelte 5 rune-based reactive state, so
 * components can react to it (e.g. disabling controls while transitioning). One of three
 * mutually exclusive states at a time: 'IDLE' (no animation in progress), 'SIMULATING' (the
 * force simulation is running), or 'TRANSITIONING' (a view change animation is in progress).
 * GraphD3 and TransitionToolbox are responsible for keeping this in sync with what's actually
 * happening on the canvas.
 */
class GraphState {
	private _state = $state<'TRANSITIONING' | 'SIMULATING' | 'IDLE'>('TRANSITIONING');
	readonly state = $derived(this._state);

	isIdle() {
		return this._state === 'IDLE';
	}
	toIdle() {
		this._state = 'IDLE';
	}

	isSimulating() {
		return this._state === 'SIMULATING';
	}
	toSimulating() {
		this._state = 'SIMULATING';
	}

	isTransitioning() {
		return this._state === 'TRANSITIONING';
	}

	toTransitioning() {
		this._state = 'TRANSITIONING';
	}
}

/** The single shared GraphState instance for the currently mounted graph canvas. */
export const graphState = new GraphState();
