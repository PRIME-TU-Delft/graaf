<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import { createNewLinkSchema } from '$lib/zod/graphSchema';
	import type { Course, Graph, Link } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from '../$types';

	type AddAliasLinkProps = {
		course: Course & {
			links: Link[];
		};
		graph: Graph;
		onSuccess: (link: Link) => void;
	};

	let { course, graph, onSuccess }: AddAliasLinkProps = $props();
	const id = $props.id();

	const form = superForm((page.data as PageData).createLinkForm, {
		id: 'delete-graph-link-' + id,
		validators: zodClient(createNewLinkSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully added link!');

				console.log({ result });
				onSuccess(result!.data!.link as Link);
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.courseId = course.id;
	});
</script>

<form class="flex items-center gap-2" action="?/add-link" method="POST" use:enhance>
	<input type="text" name="graphId" value={graph.id} hidden />
	<input type="text" name="courseId" value={course.id} hidden />

	<Form.Field {form} name="name" class="grow">
		<Form.Control>
			{#snippet children({ props })}
				<Input class="grow" {...props} placeholder="Add an alias" bind:value={$formData.name} />
			{/snippet}
		</Form.Control>
	</Form.Field>

	<Form.FormButton disabled={$submitting} loading={$delayed} loadingMessage="Adding link...">
		Add link
	</Form.FormButton>
</form>
