<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import { courseSchema } from '$lib/zod/courseSchema';
	import type { Program, User } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	type Props = {
		createNewCourseForm: SuperValidated<Infer<typeof courseSchema>>;
		program: Program & { admins: User[]; editors: User[] };
		dialogOpen: boolean;
	};

	// eslint-disable-next-line svelte/no-unused-props
	let { createNewCourseForm, program, dialogOpen = $bindable() }: Props = $props();
	const id = useId();

	const form = superForm(createNewCourseForm, {
		validators: zodClient(courseSchema),
		id: `new-course-${id}`,
		onResult: ({ result }) => {
			if (result.type == 'success') {
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance: newCourseEnhance, submitting, delayed } = form;
</script>

<form action="?/new-course" method="POST" use:newCourseEnhance>
	<input type="hidden" name="programId" value={program.id} />

	<div class="flex gap-3">
		<Form.Field {form} name="code" class="grow">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Code</Form.Label>
					<Input {...props} bind:value={$formData.code} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="mb-2" />
			<Form.Description>Code from Brightspace or similar (i.e. CS1000)</Form.Description>
		</Form.Field>

		<Form.Field {form} name="name" class="grow">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Name</Form.Label>
					<Input {...props} bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="!mb-2" />
			<Form.Description>This is a common name for the course</Form.Description>
		</Form.Field>
	</div>

	<div class="mt-4 flex w-full justify-end">
		<Form.FormButton disabled={$submitting} loading={$delayed}>
			Create new course
			{#snippet loadingMessage()}
				<span>Adding course...</span>
			{/snippet}
		</Form.FormButton>
	</div>
</form>
