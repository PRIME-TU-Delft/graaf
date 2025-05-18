<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Label from '$lib/components/ui/label/index.js';
	import { lectureSchema } from '$lib/zod/lectureSchema';
	import { Check } from '@lucide/svelte';
	import type { Graph, Lecture, Subject } from '@prisma/client';
	import { Checkbox, useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	type Props = {
		lecture: Lecture & {
			subjects: Subject[];
		};
		graph: Graph & { subjects: Subject[] };
	};

	const { lecture, graph }: Props = $props();

	let dialogOpen = $state(false);
	let subjectsLinked: string[] = $state(lecture.subjects.map((s) => s.id.toString()));

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

	$effect(() => {
		if (lecture) {
			$formData.lectureId = lecture.id;
			$formData.name = lecture.name;
			$formData.graphId = graph.id;
		}
	});
</script>

<DialogButton
	bind:open={dialogOpen}
	icon={subjectsLinked.length > 0 ? 'edit' : 'plus'}
	button={subjectsLinked.length > 0 ? 'Edit subjects' : 'Add subjects'}
	title="Link/Unlink Subjects to Lecture"
	description="A lecture can have zero or more subjects."
>
	<form action="?/link-subject-to-lecture" method="POST" use:enhance>
		<input type="hidden" name="lectureId" value={lecture.id} />
		<input type="hidden" name="graphId" value={graph.id} />
		<input type="hidden" name="name" value={lecture.name} />

		<Checkbox.Group class="flex flex-col gap-3" bind:value={subjectsLinked} name="Subjects">
			<div class="flex flex-col gap-4">
				{#each graph.subjects.toSorted( (a, b) => (a.name > b.name ? -1 : 1) ) as subject (subject.id)}
					{@render MyCheckbox({ label: subject.name, value: subject.id.toString() })}
				{/each}
			</div>
		</Checkbox.Group>

		<Form.Fieldset {form} name="subjectIds" class="h-0">
			{#each subjectsLinked, i}
				<Form.ElementField {form} name="subjectIds[{i}]">
					<Form.Control>
						{#snippet children({ props })}
							<input
								hidden
								bind:value={() => subjectsLinked[i], (v) => ($formData.subjectIds[i] = Number(v))}
								{...props}
							/>
						{/snippet}
					</Form.Control>
				</Form.ElementField>
			{/each}
			<Form.FieldErrors />
		</Form.Fieldset>

		<div
			class="sticky bottom-0 mt-4 flex w-full justify-end bg-gradient-to-b from-white/0 to-white/100 py-4 backdrop-blur-sm"
		>
			<Form.Button disabled={$submitting} loading={$delayed}>(Un-)link Subjects</Form.Button>
		</div>
	</form>
</DialogButton>

{#snippet MyCheckbox({ value, label }: { value: string; label: string })}
	{@const id = useId()}
	<div class="flex items-center">
		<Checkbox.Root
			{id}
			aria-labelledby="{id}-label"
			class="data-[state=unchecked]:border-border-input data-[state=unchecked]:hover:border-dark-40 peer inline-flex size-[25px] items-center justify-center rounded-md border border-muted bg-foreground transition-all duration-150 ease-in-out active:scale-[0.98] data-[state=unchecked]:bg-background"
			name="hello"
			{value}
		>
			{#snippet children({ checked })}
				<div class="inline-flex items-center justify-center text-background">
					{#if checked}
						<Check class="size-[15px]" />
					{/if}
				</div>
			{/snippet}
		</Checkbox.Root>
		<Label.Root
			id="{id}-label"
			for={id}
			class="pl-3 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			{label}
		</Label.Root>
	</div>
{/snippet}
