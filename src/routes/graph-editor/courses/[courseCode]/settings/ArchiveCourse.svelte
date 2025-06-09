<script lang="ts">
	import { page } from '$app/state';
	import { changeArchiveSchema } from '$lib/zod/courseSchema';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// Components
	import * as Form from '$lib/components/ui/form/index.js';

	// Icons
	import { Archive, ArchiveRestore } from 'lucide-svelte';

	// Types
	import type { Course } from '@prisma/client';
	import type { PageData } from './$types';

	type ChangeRoleProps = {
		course: Course;
		onSuccess?: () => void;
	};

	let { course, onSuccess = () => {} }: ChangeRoleProps = $props();

	const form = superForm((page.data as PageData).changeArchiveForm, {
		id: 'changeArchive',
		validators: zodClient(changeArchiveSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				if (!course.isArchived) {
					toast.success(`Archived Course!`);
				} else {
					toast.success(`Restored Course!`);
				}

				onSuccess();
			}
		}
	});
	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.courseId = course.id;
		$formData.archive = !course.isArchived;
	});
</script>

<form action="?/change-archive" method="POST" class="ml-auto" use:enhance>
	<input type="hidden" name="courseId" value={course.id} />
	<input type="hidden" name="archive" value={!course.isArchived} />

	<Form.FormError {form} />
	<Form.FormButton
		variant="destructive"
		disabled={$submitting}
		loading={$delayed}
		class="justify-self-end"
	>
		{#if course.isArchived}
			<ArchiveRestore /> Restore Course
		{:else}
			<Archive /> Archive Course
		{/if}

		{#snippet loadingMessage()}
			<span>Changing state...</span>
		{/snippet}
	</Form.FormButton>
</form>
