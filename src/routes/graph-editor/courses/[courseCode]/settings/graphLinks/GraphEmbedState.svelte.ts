export class EmbedState {
	alias: string | undefined = $state(undefined);
	show: 'Lecture' | 'Domains' | 'Subjects' = $state('Subjects');
	showLecture: undefined | string = $state(undefined);
	iframeHeight: number = $state(500);

	selectAlias(alias: string) {
		if (graphEmbedState.alias == undefined) graphEmbedState.alias = alias;
		else if (graphEmbedState.alias == alias) graphEmbedState.alias = undefined;
		else graphEmbedState.alias = alias;
	}

	selectShow(show: string) {
		const options = ['Lecture', 'Domains', 'Subjects'];
		if (!options.includes(show)) {
			throw new Error(`Invalid show option: ${show}. Expected one of ${options.join(', ')}`);
		}

		graphEmbedState.show = show as 'Lecture' | 'Domains' | 'Subjects';
	}

	selectShowLecture(show: string) {
		if (graphEmbedState.showLecture == show) graphEmbedState.showLecture = undefined;
		else graphEmbedState.showLecture = show;
	}
}

export const graphEmbedState = new EmbedState();
