export class GraphView {
	static domains = 'DOMAINS';
	static subjects = 'SUBJECTS';
	static lectures = 'LECTURES';
}

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

export const graphView = new GraphViewState();
