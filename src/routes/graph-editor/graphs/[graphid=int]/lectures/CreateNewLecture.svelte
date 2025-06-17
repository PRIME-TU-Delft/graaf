<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import { lectureSchema } from '$lib/zod/lectureSchema';
	import type { Graph } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	type Props = {
		graph: Graph;
	};

	const { graph }: Props = $props();

	let dialogOpen = $state(false);

	const form = superForm((page.data as PageData).newLectureForm, {
		id: 'create-lecture-form-' + useId(),
		validators: zodClient(lectureSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Lecture created successfully!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.graphId = graph.id;
	});
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="plus"
	button="New Lecture"
	title="Create Lecture"
	description="A lecture stores multiple subjects"
	class="sticky top-2 z-10 float-right -mt-14 h-9"
>
	<!-- For sumbitting a NEW PROGRAM
 	It triggers an action that can be seen in +page.server.ts -->
	<form action="?/add-lecture-to-graph" method="POST" use:enhance>
		<input type="hidden" name="graphId" value={graph.id} />

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Lecture name</Form.Label>
					<Input {...props} bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Button disabled={$submitting} loading={$delayed} class="float-right mt-4">
			Create Lecture
		</Form.Button>
	</form>
</DialogButton>
