<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import { hasProgramPermissions } from '$lib/utils/permissions';
	import { courseSchema } from '$lib/zod/courseSchema';
	import type { Program, User } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	type Props = {
		courseForm: SuperValidated<Infer<typeof courseSchema>>;
		courseValue: string;
		program: Program & { admins: User[]; editors: User[] };
		user: User;
		errorMessage?: string;
	};

	const {
		courseForm,
		courseValue,
		program,
		user,
		errorMessage = 'You do not have the permissions to create a new course'
	}: Props = $props();
	const id = useId();

	let dialogOpen = $state(false);

	const form = superForm(courseForm, {
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

{#if hasProgramPermissions(user, program, 'ProgramAdmin')}
	<DialogButton
		bind:open={dialogOpen}
		onclick={() => {
			$formData.name = courseValue;
			$formData.programId = program.id;
		}}
		icon="plus"
		button="New Course for {program.name}"
		title="Create Course"
	>
		<form action="?/new-course" method="POST" use:newCourseEnhance>
			<input type="hidden" name="programId" value={program.id} />

			<Form.Field {form} name="code">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Code</Form.Label>
						<Input {...props} bind:value={$formData.code} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
				<Form.Description>
					This is the course code from Brightspace or similar (i.e. CS1000)
				</Form.Description>
			</Form.Field>

			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Name</Form.Label>
						<Input {...props} bind:value={$formData.name} />
					{/snippet}
				</Form.Control>
				<Form.Description>This is a common name for the course</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Form.FormButton class="float-right" disabled={$submitting} loading={$delayed}>
				Add course
				{#snippet loadingMessage()}
					<span>Adding course...</span>
				{/snippet}
			</Form.FormButton>
		</form>
	</DialogButton>
{:else}
	<p>{errorMessage}</p>
{/if}
