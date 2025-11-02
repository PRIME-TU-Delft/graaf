<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import type { Graph, Lecture, Subject } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import { changeLectureSubjects } from './lecture.remote';

	type Props = {
		lecture: Lecture & {
			subjects: Subject[];
		};
		graph: Graph & { subjects: Subject[] };
	};

	const { lecture, graph }: Props = $props();

	let dialogOpen = $state(false);
	let formRef = $state<HTMLFormElement>();

	class SubjectItem {
		id: number;
		name: string;
		enabled = $state(false);

		constructor(id: number, name: string) {
			this.id = id;
			this.name = name;
			this.enabled = lecture.subjects.find((subject) => subject.id === id)?.id === id;
		}
	}

	let subjectItems = $derived(
		graph.subjects.map((subject) => new SubjectItem(subject.id, subject.name))
	);
</script>

<DialogButton
	bind:open={dialogOpen}
	icon={lecture.subjects.length > 0 ? 'edit' : 'plus'}
	button={lecture.subjects.length > 0 ? 'Edit subjects' : 'Add subjects'}
	title="Link/Unlink Subjects to Lecture"
	description="A lecture can have zero or more subjects."
>
	<form
		{...changeLectureSubjects.enhance(async ({ form, submit }) => {
			try {
				await submit().updates(getGraph(graph.id));

				console.log(changeLectureSubjects.fields.allIssues());
				if (changeLectureSubjects.fields.allIssues()?.length) return;

				form.reset();
				dialogOpen = false;
				toast.success('Lecture changed successfully!');
			} catch (e) {
				toast.error(JSON.stringify(e));
			}
		})}
		bind:this={formRef}
	>
		<input hidden {...changeLectureSubjects.fields.graphId.as('number')} value={graph.id} />
		<input hidden {...changeLectureSubjects.fields.lectureId.as('number')} value={lecture.id} />

		<Field.Group class="gap-3">
			{#each subjectItems as subjectItem (subjectItem.id)}
				<Field.Field orientation="horizontal">
					<Checkbox
						id="checkbox-{subjectItem.name}-{subjectItem.id}"
						bind:checked={subjectItem.enabled}
					/>
					<Field.Label for="checkbox-{subjectItem.name}-{subjectItem.id}" class="font-normal">
						{subjectItem.name}
					</Field.Label>
				</Field.Field>
			{/each}
		</Field.Group>

		{#each subjectItems.filter((s) => s.enabled) as subjectItem, index (subjectItem.id)}
			{#if subjectItem.enabled}
				<input
					hidden
					{...changeLectureSubjects.fields.subjects[index].as('number')}
					value={subjectItem.id}
				/>
			{/if}
		{/each}

		<Field.Submit
			form={changeLectureSubjects}
			oncancel={() => {
				formRef?.reset();
				dialogOpen = false;
			}}
			submitTitle="Change Lecture"
			loadingTitle="Changing Lecture..."
		/>
	</form>
</DialogButton>
