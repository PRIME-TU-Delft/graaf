<script lang="ts">
	import type { CoursePermissions } from '$lib/utils/permissions';
	import type { Course, Graph, Lecture } from '@prisma/client';
	import GraphLinkSettings from './GraphLinkSettings.svelte';
	import DialogButton from '$lib/components/DialogButton.svelte';

	type GraphLinksProps = {
		course: Course & CoursePermissions;
		graph: Graph & {
			lectures: Lecture[];
		};
	};

	const { course, graph }: GraphLinksProps = $props();
	let graphLinkSettingsOpen = $state(false);
</script>

<DialogButton
	bind:open={graphLinkSettingsOpen}
	icon="link"
	button="Settings"
	title="Graph link settings"
>
	<GraphLinkSettings {course} {graph} onSuccess={() => (graphLinkSettingsOpen = false)} />
</DialogButton>
