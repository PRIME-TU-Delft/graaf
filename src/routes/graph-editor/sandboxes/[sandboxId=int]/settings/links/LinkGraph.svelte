<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import GraphLinkSettings from './GraphLinkSettings.svelte';

	import type { SandboxPermissions } from '$lib/utils/permissions';
	import type { Sandbox, Graph, Lecture, Link } from '@prisma/client';

	type GraphLinksProps = {
		graph: Graph & { lectures: Lecture[]; links: Link[] };
		sandbox: Sandbox &
			SandboxPermissions & {
				graphs: Graph[];
				links: Link[];
			};
	};

	const { sandbox, graph }: GraphLinksProps = $props();

	let graphLinkSettingsOpen = $state(false);

	function handleOpenGraphSettings(e: MouseEvent) {
		e.preventDefault();
		graphLinkSettingsOpen = true;
	}
</script>

<DialogButton
	bind:open={graphLinkSettingsOpen}
	onclick={(e) => handleOpenGraphSettings(e)}
	icon="link"
	button="Link Settings"
	title="Link Settings"
	class="grow"
>
	<GraphLinkSettings
		{sandbox}
		{graph}
		graphs={sandbox.graphs}
		onSuccess={() => (graphLinkSettingsOpen = false)}
	/>
</DialogButton>