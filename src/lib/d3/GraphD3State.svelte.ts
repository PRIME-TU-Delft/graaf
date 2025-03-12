class GraphState {
	private state = $state<'TRANSITIONING' | 'SIMULATING' | 'IDLE'>('TRANSITIONING');

	isIdle() {
		return this.state === 'IDLE';
	}
	toIdle() {
		this.state = 'IDLE';
	}

	isSimulating() {
		return this.state === 'SIMULATING';
	}
	toSimulating() {
		this.state = 'SIMULATING';
	}

	isTransitioning() {
		return this.state === 'TRANSITIONING';
	}
	toTransitioning() {
		this.state = 'TRANSITIONING';
	}
}

export const graphState = new GraphState();
