<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { courseSchema } from '$lib/zod/courseSchema';
	import type { Course } from '@prisma/client';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	type EditCourseNameProps = {
		course: Course;
		editCourseForm: SuperValidated<Infer<typeof courseSchema>>;
		onSuccess: () => void;
	};

	let { course, editCourseForm, onSuccess }: EditCourseNameProps = $props();

	const form = superForm(editCourseForm, {
		validators: zodClient(courseSchema),
		id: `edit-course-name`,
		onResult: ({ result }) => {
			if (result.type == 'success') onSuccess();
		}
	});

	const { form: formData, enhance: newCourseEnhance, submitting, delayed } = form;

	$effect(() => {
		$formData.name = course.name;
		$formData.code = course.code;
	});
</script>

<form action="?/edit-course" method="POST" use:newCourseEnhance>
	<input type="hidden" name="code" value={course.code} />

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
		disabled={$submitting || $formData.name == course.name}
		loading={$delayed}
	>
		Save new name
		{#snippet loadingMessage()}
			<span>Saving new name...</span>
		{/snippet}
	</Form.FormButton>
</form>
