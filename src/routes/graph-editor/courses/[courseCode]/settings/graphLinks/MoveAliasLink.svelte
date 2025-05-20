<script lang="ts">
	import { page } from '$app/state';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import { editLinkSchema } from '$lib/zod/linkSchema';
	import { Check, ChevronDown } from '@lucide/svelte';
	import type { Course, Graph, Link } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from '../$types';

	type GraphLinksProps = {
		course: Course;
		graph: Graph;
		graphs: Graph[];
		link: Link;
		onSuccess?: () => void;
	};

	const { course, graph, graphs, link, onSuccess = () => {} }: GraphLinksProps = $props();

	const id = $props.id();

	let graphId = $state(graph.id);

	const form = superForm((page.data as PageData).editLinkForm, {
		id: 'move-graph-link-' + id,
		validators: zodClient(editLinkSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully move link!');

				onSuccess();
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.graphId = graphId;
		$formData.parentId = course.id;
		$formData.parentType = 'COURSE';
		$formData.linkId = link.id;
	});
</script>

<Popover.Root>
	<Popover.Trigger class={cn(buttonVariants({ variant: 'outline' }))}>
		Move link to... <ChevronDown />
	</Popover.Trigger>
	<Popover.Content>
		<form action="?/move-link" method="POST" use:enhance>
			<input type="text" name="courseId" value={course.id} hidden />
			<input type="text" name="linkId" value={link.id} hidden />
			<input type="text" name="graphId" value={graphId} hidden />

			{#each graphs as newGraph (newGraph.id)}
				<Button
					variant="ghost"
					class="w-full justify-between"
					disabled={newGraph.id === graph.id}
					onclick={() => {
						graphId = newGraph.id;
					}}
				>
					{newGraph.name}
					<Check class={cn('ml-auto', newGraph.id !== $formData.graphId && 'text-transparent')} />
				</Button>
			{/each}

			<Form.FormButton disabled={$submitting} loading={$delayed} loadingMessage="Deleting...">
				Move to {graphs.find((g) => g.id == graphId)!.name}
			</Form.FormButton>
		</form>
	</Popover.Content>
</Popover.Root>
