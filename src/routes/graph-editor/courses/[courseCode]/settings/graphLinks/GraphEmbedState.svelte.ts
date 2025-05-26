export class EmbedState {
	alias: string;

	isOpen: boolean = $state(false);

	show: 'Lecture' | 'Domains' | 'Subjects' = $state('Subjects');
	showLecture: undefined | string = $state(undefined);
	iframeHeight: number = $state(500);

	constructor(alias: string) {
		this.alias = alias;
	}

	static selectShow(state: EmbedState, show: string) {
		const options = ['Lecture', 'Domains', 'Subjects'];
		if (!options.includes(show)) {
			throw new Error(`Invalid show option: ${show}. Expected one of ${options.join(', ')}`);
		}

		state.show = show as 'Lecture' | 'Domains' | 'Subjects';
	}

	static selectShowLecture(state: EmbedState, show: string) {
		if (state.showLecture == show) state.showLecture = undefined;
		else state.showLecture = show;
	}
}
