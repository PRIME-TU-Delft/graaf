<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { linkingCoursesSchema } from '$lib/zod/superUserProgramSchema';
	import type { Course, Program } from '@prisma/client';
	import type { RowSelectionState } from '@tanstack/table-core';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	type DataTableProps = {
		program: Program;
		courses: Course[];
		rowSelection: RowSelectionState;
		linkCoursesForm: SuperValidated<Infer<typeof linkingCoursesSchema>>;
		onSuccess?: () => void;
	};

	let {
		program,
		courses,
		rowSelection = $bindable(),
		linkCoursesForm,
		onSuccess = () => {}
	}: DataTableProps = $props();

	const selectedCourses = $derived(
		Object.entries(rowSelection)
			.filter(([_, selected]) => selected)
			.map(([i]) => i)
			.map(Number)
			.map((i) => courses[i])
	);

	const form = superForm(linkCoursesForm, {
		id: 'link-courses-form',
		validators: zodClient(linkingCoursesSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully linked courses!');

				onSuccess();
				rowSelection = {};
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.programId = program.id;
		$formData.courseCodes = selectedCourses.map((c) => c?.code) as [string, ...string[]];
	});
</script>

{#if selectedCourses.length > 0}
	<div in:fly={{ y: 10 }}>
		<form action="?/link-courses" method="POST" use:enhance>
			<input type="text" name="programId" value={program.id} hidden />

			<Form.Fieldset {form} name="courseCodes" class="h-0">
				{#each $formData.courseCodes as _, i}
					<Form.ElementField {form} name="courseCodes[{i}]">
						<Form.Control>
							{#snippet children({ props })}
								<input type="hidden" bind:value={$formData.courseCodes[i]} {...props} />
							{/snippet}
						</Form.Control>
					</Form.ElementField>
				{/each}
			</Form.Fieldset>

			<Form.FormButton disabled={$submitting} loading={$delayed}>
				Link {selectedCourses.length} courses
				{#snippet loadingMessage()}
					<span>Linking courses...</span>
				{/snippet}
			</Form.FormButton>
		</form>
	</div>
{/if}
