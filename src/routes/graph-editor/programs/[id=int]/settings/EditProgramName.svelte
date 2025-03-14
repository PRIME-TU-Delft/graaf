<script lang="ts">
	import { editProgramSchema } from '$lib/zod/superUserProgramSchema';
	import type { Program } from '@prisma/client';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';

	type EditProgramNameProps = {
		program: Program;
		editProgramForm: SuperValidated<Infer<typeof editProgramSchema>>;
		onSuccess: () => void;
	};

	let { program, editProgramForm, onSuccess }: EditProgramNameProps = $props();

	const form = superForm(editProgramForm, {
		validators: zodClient(editProgramSchema),
		id: `edit-program-name`,
		onResult: ({ result }) => {
			if (result.type == 'success') onSuccess();
		}
	});

	const { form: formData, enhance: newCourseEnhance, submitting, delayed } = form;

	$effect(() => {
		if (program) {
			$formData.name = program.name;
			$formData.programId = program.id;
		}
	});
</script>

<form action="?/edit-program" method="POST" use:newCourseEnhance>
	<input type="hidden" name="programId" value={program.id} />

	<div class="flex gap-3">
		<Form.Field {form} name="name" class="grow">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>New name</Form.Label>
					<Input {...props} bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="mb-2" />
		</Form.Field>
	</div>

	<Form.FormError class="my-2" {form} />

	<Form.FormButton
		class="float-right"
		disabled={$submitting || $formData.name == program.name}
		loading={$delayed}
	>
		Save new name
		{#snippet loadingMessage()}
			<span>Saving new name...</span>
		{/snippet}
	</Form.FormButton>
</form>
