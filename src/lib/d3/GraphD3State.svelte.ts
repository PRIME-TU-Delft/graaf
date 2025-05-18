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

export const graphState = new GraphState();
