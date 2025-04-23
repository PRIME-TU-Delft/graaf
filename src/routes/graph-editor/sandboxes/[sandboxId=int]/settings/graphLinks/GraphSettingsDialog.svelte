<script lang="ts">
	import GraphLinkSettings from './GraphLinkSettings.svelte';
	import DialogButton from '$lib/components/DialogButton.svelte';
	
	import type { SandboxPermissions } from '$lib/utils/permissions';
	import type { Sandbox, Graph, Lecture, Link } from '@prisma/client';

	type GraphLinksProps = {
		sandbox: Sandbox & SandboxPermissions & { 
			links: Link[] 
		};
		graph: Graph & {
			lectures: Lecture[];
			links: Link[];
		};
		graphs: Graph[];
	};

	const { sandbox, graph, graphs }: GraphLinksProps = $props();
	let graphLinkSettingsOpen = $state(false);
</script>

<DialogButton
	bind:open={graphLinkSettingsOpen}
	icon="link"
	button="Settings"
	title="Graph link settings"
>
	<GraphLinkSettings {sandbox} {graph} {graphs} onSuccess={() => (graphLinkSettingsOpen = false)} />
</DialogButton>
