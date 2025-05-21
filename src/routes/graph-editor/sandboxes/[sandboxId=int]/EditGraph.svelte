<script lang="ts">
	// Components
	import DuplicateGraph from './DuplicateGraph.svelte';
	import DialogButton from '$lib/components/DialogButton.svelte';

	// Types
	import type { Prisma } from '@prisma/client';

	type DuplicateGraphProps = {
		graph: Prisma.GraphGetPayload<{
			include: {
				lectures: true;
				links: true;
			};
		}>;
	};

	let { graph }: DuplicateGraphProps = $props();
	let isDuplicateOpen = $state(false);
</script>

<div class="flex flex-col gap-1 lg:flex-row">
	<DialogButton
		button="Duplicate"
		icon="copy"
		title="Duplicate Graph"
		description="Copy this graph to another course or sandbox. This will create a new graph with the same content in the selected destination."
		bind:open={isDuplicateOpen}
		class="grow"
		onclick={(event) => {
			event.preventDefault();
			isDuplicateOpen = true;
		}}
	>
		<DuplicateGraph {graph} bind:isDuplicateOpen />
	</DialogButton>
</div>
