<script lang="ts">
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { linkingCoursesSchema } from '$lib/zod/programSchema';
	import type { Course, Program } from '@prisma/client';
	import type { RowSelectionState } from '@tanstack/table-core';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from '../$types';

	type DataTableProps = {
		program: Program & { courses: Course[] };
		rowSelection: RowSelectionState;
	};

	let { program, rowSelection = $bindable() }: DataTableProps = $props();

	let dialogOpen = $state(false);

	const selectedCourses = $derived(
		Object.entries(rowSelection)
			.filter(([_, selected]) => selected) // eslint-disable-line @typescript-eslint/no-unused-vars
			.map(([i, _]) => i) // eslint-disable-line @typescript-eslint/no-unused-vars
			.map(Number)
			.map((i) => program.courses[i])
	);

	const form = superForm((page.data as PageData).linkCoursesForm, {
		id: 'unlink-courses-form',
		validators: zodClient(linkingCoursesSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully unlinked courses!');

				dialogOpen = false;
				rowSelection = {};
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.programId = program.id;
		$formData.courseIds = selectedCourses.map((c) => c.id) as [number, ...number[]];
	});
</script>

<div in:fly={{ y: 10 }}>
	<AlertDialog.Root bind:open={dialogOpen}>
		<AlertDialog.Trigger class={buttonVariants({ variant: 'destructive' })}>
			Unlink {selectedCourses.length} courses
		</AlertDialog.Trigger>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Unlink {selectedCourses.length} course(s)?</AlertDialog.Title>
				<AlertDialog.Description>
					This removes the selected course(s) from this programme. The course(s) themselves are not
					deleted.
				</AlertDialog.Description>
			</AlertDialog.Header>

			<form action="?/unlink-courses" method="POST" use:enhance>
				<input type="text" name="programId" value={program.id} hidden />

				<Form.Fieldset {form} name="courseIds" class="h-0">
					{#each $formData.courseIds, i}
						<Form.ElementField {form} name="courseIds[{i}]">
							<Form.Control>
								{#snippet children({ props })}
									<input type="hidden" bind:value={$formData.courseIds[i]} {...props} />
								{/snippet}
							</Form.Control>
						</Form.ElementField>
					{/each}
				</Form.Fieldset>

				<Form.FormError {form} />

				<AlertDialog.Footer>
					<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
					<Form.FormButton
						type="submit"
						variant="destructive"
						disabled={$submitting}
						loading={$delayed}
					>
						Unlink
						{#snippet loadingMessage()}
							<span>Unlinking...</span>
						{/snippet}
					</Form.FormButton>
				</AlertDialog.Footer>
			</form>
		</AlertDialog.Content>
	</AlertDialog.Root>
</div>
