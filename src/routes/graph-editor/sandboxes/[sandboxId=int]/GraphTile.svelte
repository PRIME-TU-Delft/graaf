<script lang="ts">
	import GraphSettings from './GraphSettings.svelte';
	import DuplicateGraph from './DuplicateGraph.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import DialogButton from '$lib/components/DialogButton.svelte';
	
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	import type { Prisma } from '@prisma/client';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import type { duplicateGraphSchema, graphSchemaWithId } from '$lib/zod/graphSchema';

	type Props = {
		graph: Prisma.GraphGetPayload<{
			include: {
				_count: {
					select: {
						domains: true;
						subjects: true;
					};
				};
			};
		}>,
		availableCourses: Prisma.CourseGetPayload<{
			include: {
				graphs: { select: { name: true } }
			}
		}>[],
		availableSandboxes: Prisma.SandboxGetPayload<{
			include: {
				graphs: { select: { name: true } },
				owner: true
			}
		}>[],
		editGraphForm: SuperValidated<Infer<typeof graphSchemaWithId>>,
		duplicateGraphForm: SuperValidated<Infer<typeof duplicateGraphSchema>>
	};

	let { 
		graph, 
		availableCourses, 
		availableSandboxes, 
		editGraphForm,
		duplicateGraphForm
	}: Props = $props();

	let isGraphSettingsOpen = $state(false);
	let isDuplicateOpen = $state(false);

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
	href="/graph-editor/graphs/{graph.id}"
>
	<div class="grow">
		<h2 class="text-xl font-bold text-blue-950">{graph.name}</h2>
		<p>Domains: {graph._count.domains}</p>
		<p>Subjects: {graph._count.subjects}</p>
	</div>
	<div class="flex grow-0 flex-col gap-1">
		<Button class="transition-colors group-hover:bg-blue-500">
			View/Edit
			<ArrowRight />
		</Button>
		
		<div class="flex flex-col gap-1 lg:flex-row">
			<DialogButton
				onclick={(e) => handleOpenDuplicate(e)}
				button="Duplicate"
				title="Duplicate/Move Graph"
				description="Copy this graph to this or another sandbox or course."
				bind:open={isDuplicateOpen}
				class="grow"
			>
				<DuplicateGraph {graph} {availableCourses} {availableSandboxes} {duplicateGraphForm} bind:isDuplicateOpen />
			</DialogButton>
		
			<DialogButton
				onclick={(e) => handleOpenGraphSettings(e)}
				button="Settings"
				title="Edit Graph"
				description="TODO"
				bind:open={isGraphSettingsOpen}
			>
				<GraphSettings {graph} {editGraphForm} bind:isGraphSettingsOpen />
			</DialogButton>
		</div>
	</div>
</a>