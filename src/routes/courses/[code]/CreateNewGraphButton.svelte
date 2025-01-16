<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { graphSchema } from './zodSchema';
	import type { Course } from '@prisma/client';

	type Props = {
		form: SuperValidated<Infer<typeof graphSchema>>;
		course: Course;
	};

	const { form: graphForm, course }: Props = $props();

	let dialogOpen = $state(false);

	const form = superForm(graphForm, {
		validators: zodClient(graphSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Graph created successfully!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance } = form;
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="plus"
	button="New Graph"
	title="Create Graph"
	description="Graphs are collections of Nodes and Edges, usually pertaining to the same field of study. Create this new graph in the {course.name}"
	class="col-span-2"
>
	<!-- For sumbitting a NEW PROGRAM
 	It triggers an action that can be seen in +page.server.ts -->
	<form action="?/add-graph-to-course" method="POST" use:enhance>
		<input type="hidden" name="courseCode" value={course.code} />

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Graph name</Form.Label>
					<Input {...props} bind:value={$formData['name']} />
				{/snippet}
			</Form.Control>
			<Form.Description>A common name for the graph</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Button class="float-right mt-4">Submit</Form.Button>
	</form>
</DialogButton>
