export class EmbedState {
	alias: string | undefined = $state(undefined);
	show: 'Lecture' | 'Domains' | 'Subjects' = $state('Subjects');
	showLecture: undefined | string = $state(undefined);
	iframeHeight: number = $state(500);

	selectAlias(alias: string) {
		if (this.alias == alias) this.alias = undefined;
		else this.alias = alias;
	}

	selectShow(show: string) {
		const options = ['Lecture', 'Domains', 'Subjects'];
		if (!options.includes(show)) {
			throw new Error(`Invalid show option: ${show}. Expected one of ${options.join(', ')}`);
		}

		this.show = show as 'Lecture' | 'Domains' | 'Subjects';
	}

	selectShowLecture(show: string) {
		if (this.showLecture == show) this.showLecture = undefined;
		else this.showLecture = show;
	}
}
