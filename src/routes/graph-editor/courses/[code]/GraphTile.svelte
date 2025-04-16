<script lang="ts">
	import { page } from '$app/state';

	import type { Prisma } from '@prisma/client';

	// Components
	import DuplicateGraph from './DuplicateGraph.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import GraphSettings from './GraphSettings.svelte';

	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	let {
		graph,
		hasAtLeastCourseEditPermissions
	}: {
		graph: Prisma.GraphGetPayload<{}>;
		hasAtLeastCourseEditPermissions: boolean;
	} = $props();

	let isGraphSettingsOpen = $state(false);
	let isDuplicateOpen = $state(false);
	const data = page.data;

	function handleOpenGraphSettings(e: MouseEvent) {
		e.preventDefault();
		isGraphSettingsOpen = true;
	}

	function handleOpenDuplicate(e: MouseEvent) {
		e.preventDefault();
		isDuplicateOpen = true;
	}
</script>

<a
	class="group grid w-full grid-cols-2 items-center gap-1 rounded border-2 border-blue-300 bg-blue-100 p-4 text-blue-900 shadow-none transition-shadow hover:shadow-lg"
	href="/graph-editor/graphs/{data.graph.id}"
>
	<div class="grow">
		<h2 class="text-xl font-bold text-blue-950">{data.graph.name}</h2>
		<p>Domains: {data.graph._count.domains}</p>
		<p>Subjects: {data.graph._count.subjects}</p>
	</div>
	<div class="flex grow-0 flex-col gap-1">
		<Button class="transition-colors group-hover:bg-blue-500">
			View{#if hasAtLeastCourseEditPermissions}/Edit{/if}
			<ArrowRight />
		</Button>

		{#if hasAtLeastCourseEditPermissions}
			<div class="flex flex-col gap-1 lg:flex-row">
				<DialogButton
					onclick={(e) => handleOpenDuplicate(e)}
					button="Duplicate"
					title="Duplicate/Move Graph"
					description="Copy this graph to this or another sandbox or course."
					bind:open={isDuplicateOpen}
					class="grow"
				>
					<DuplicateGraph
						{graph}
						availableCourses={data.availableCourses}
						availableSandboxes={data.availableSandboxes}
						bind:isDuplicateOpen
					/>
				</DialogButton>

				<DialogButton
					onclick={(e) => handleOpenGraphSettings(e)}
					button="Settings"
					title="Edit Graph"
					description="TODO"
					bind:open={isGraphSettingsOpen}
				>
					<GraphSettings {graph} bind:isGraphSettingsOpen />
				</DialogButton>
			</div>
		{/if}
	</div>
</a>
