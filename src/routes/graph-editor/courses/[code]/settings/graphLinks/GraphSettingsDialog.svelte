<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import type { CoursePermissions } from '$lib/utils/permissions';
	import type { Course, Graph, Lecture, Link } from '@prisma/client';
	import GraphLinkSettings from './GraphLinkSettings.svelte';

	type GraphLinksProps = {
		course: Course & CoursePermissions & { links: Link[] };
		graph: Graph & {
			lectures: Lecture[];
			links: Link[];
		};
		graphs: Graph[];
	};

	const { course, graph, graphs }: GraphLinksProps = $props();
	let graphLinkSettingsOpen = $state(false);
</script>

<DialogButton
	bind:open={graphLinkSettingsOpen}
	icon="link"
	button="Settings"
	title="Graph link settings"
>
	<GraphLinkSettings {course} {graph} {graphs} onSuccess={() => (graphLinkSettingsOpen = false)} />
</DialogButton>
