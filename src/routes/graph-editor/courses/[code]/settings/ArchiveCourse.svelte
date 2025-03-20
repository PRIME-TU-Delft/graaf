<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import { changeArchive } from '$lib/zod/courseSchema';
	import type { Course } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	type ChangeRoleProps = {
		course: Course;
		onSuccess?: () => void;
	};

	let { course, onSuccess = () => {} }: ChangeRoleProps = $props();

	const form = superForm((page.data as PageData).changeArchiveForm, {
		id: 'changeArchive',
		validators: zodClient(changeArchive),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success(`Changed to ${!course.isArchived ? 'Archived' : 'De-Archived'}!`);
				onSuccess();
			}
		}
	});
	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.code = course.code;
		$formData.archive = !course.isArchived;
	});
</script>

<form action="?/change-archive" method="POST" class="ml-auto" use:enhance>
	<input type="hidden" name="code" value={course.code} />
	<input type="hidden" name="archive" value={!course.isArchived} />

	<Form.FormError {form} />
	<Form.FormButton
		variant={'destructive'}
		disabled={$submitting}
		loading={$delayed}
		class="justify-self-end"
	>
		{course.isArchived ? 'De-archive' : 'Archive'} course
		{#snippet loadingMessage()}
			<span>Changing state...</span>
		{/snippet}
	</Form.FormButton>
</form>
