<script lang="ts">
	import type { Prisma } from '@prisma/client';

	import DialogButton from '$lib/components/DialogButton.svelte';
	import DuplicateGraph from './DuplicateGraph.svelte';

	let {
		graph,
		availableCourses,
		availableSandboxes
	}: {
		graph: Prisma.GraphGetPayload<{
			include: {
				lectures: true;
				links: true;
			};
		}>;
		availableCourses: Prisma.CourseGetPayload<{
			include: {
				graphs: { select: { name: true } };
			};
		}>[];
		availableSandboxes: Prisma.SandboxGetPayload<{
			include: {
				owner: true;
				graphs: { select: { name: true } };
			};
		}>[];
	} = $props();

	let isDuplicateOpen = $state(false);

	function handleOpenDuplicate(e: MouseEvent) {
		e.preventDefault();
		isDuplicateOpen = true;
	}
</script>

<div class="flex flex-col gap-1 lg:flex-row">
	<DialogButton
		onclick={(e) => handleOpenDuplicate(e)}
		button="Duplicate"
		icon="copy"
		title="Duplicate/Move Graph"
		description="Copy this graph within this or another course. This will create a new graph with the same content in the selected course."
		bind:open={isDuplicateOpen}
		class="grow"
	>
		<DuplicateGraph {graph} {availableCourses} {availableSandboxes} bind:isDuplicateOpen />
	</DialogButton>
</div>
