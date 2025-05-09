<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { lectureSchema } from '$lib/zod/lectureSchema';
	import type { Graph, Lecture, Subject } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import { fromStore } from 'svelte/store';

	type Props = {
		lecture: Lecture & {
			subjects: Subject[];
		};
		graph: Graph & { subjects: Subject[] };
	};

	const { lecture, graph }: Props = $props();

	let dialogOpen = $state(false);
	let subjectsLinked: number[] = $derived(lecture.subjects.map((s) => s.id));

	const form = superForm((page.data as PageData).newLectureForm, {
		id: 'linking-subject-to-lecture-form-' + useId(),
		validators: zodClient(lectureSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('lectures successfully (un-)linked!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="plus"
	button="Edit Subjects"
	title="Link/Unlink Subjects to Lecture"
	description="A lecture can have zero or more subjects."
>
	<form action="?/link-subject-to-lecture" method="POST" use:enhance>
		<input type="hidden" name="lectureId" value={lecture.id} />
		<input type="hidden" name="name" value={lecture.name} />

		{#each graph.subjects as subject}
			<div class="flex items-center">
				<input
					id={subject.id.toString()}
					type="checkbox"
					name="linkedSubjects"
					value={subject}
					bind:group={subjectsLinked}
				/>
				<label for={subject.id.toString()} class="ml-2">
					{subject.name}
				</label>
			</div>
		{/each}

		<Form.Fieldset {form} name="subjectIds" class="h-0">
			{#each subjectsLinked, i}
				<Form.ElementField {form} name="subjectIds[{i}]">
					<Form.Control>
						{#snippet children({ props })}
							<input
								bind:value={() => subjectsLinked[i], (v) => ($formData.subjectIds[i] = v)}
								{...props}
							/>
						{/snippet}
					</Form.Control>
				</Form.ElementField>
			{/each}
			<Form.FieldErrors />
		</Form.Fieldset>

		<Form.Button disabled={$submitting} loading={$delayed} class="bottom-4 float-right mt-4">
			(Un-)link Subjects
		</Form.Button>
	</form>
</DialogButton>
