/** The three views a graph canvas can display. Used both as a value (GraphD3's constructor and
 * setView take a GraphView) and as the type of GraphViewState's underlying state. */
export class GraphView {
	static domains = 'DOMAINS';
	static subjects = 'SUBJECTS';
	static lectures = 'LECTURES';
}

/**
 * Tracks the graph canvas's currently displayed view (domains/subjects/lectures) as Svelte 5
 * rune-based reactive state, so components can react to it (e.g. highlighting the active view
 * toggle). GraphD3 and TransitionToolbox are responsible for keeping this in sync with what's
 * actually rendered on the canvas.
 */
class GraphViewState {
	private view = $state(GraphView.domains);

	get state() {
		return this.view;
	}

	isDomains() {
		return this.view === GraphView.domains;
	}
	toDomains() {
		this.view = GraphView.domains;
	}

	isSubjects() {
		return this.view === GraphView.subjects;
	}

	toSubjects() {
		this.view = GraphView.subjects;
	}

	isLectures() {
		return this.view === GraphView.lectures;
	}

	toLectures() {
		this.view = GraphView.lectures;
	}
}

/** The single shared GraphViewState instance for the currently mounted graph canvas. */
export const graphView = new GraphViewState();
