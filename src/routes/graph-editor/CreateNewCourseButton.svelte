<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import type { Program, User } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { courseSchema } from '$lib/zod/programCourseSchema';
	import { hasProgramPermissions } from '$lib/utils/permissions';

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

	const { form: formData, enhance: newCourseEnhance } = form;
</script>

{#if hasProgramPermissions( user, program, { programAdmin: true, programEditor: false, superAdmin: true } )}
	<DialogButton
		bind:open={dialogOpen}
		onclick={() => {
			$formData.name = courseValue;
			$formData.programId = program.id;
		}}
		icon="plus"
		button="New Course for {program.name}"
		title="Create Course"
		description="TODO"
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
					This is the course code from for instance Brightspace (i.e. CS1000)
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

			<Form.Button class="float-right mt-4">Submit</Form.Button>
		</form>
	</DialogButton>
{:else}
	<p>{errorMessage}</p>
{/if}
