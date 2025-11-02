<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { cn } from '$lib/utils';
	import type { Issue, PrismaGraphPayload } from '$lib/validators/types';
	import { Plus, Replace } from '@lucide/svelte';
	import type { Lecture, Subject } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import IssueIndicator from '../IssueIndicator.svelte';
	import { moveSubjectToLecture } from './lecture.remote';

	type Props = {
		issues: { [key: number]: Issue[] };
		subjects: Subject[];
		graph: PrismaGraphPayload;
		lectures: PrismaGraphPayload['lectures'];
		lecture: Lecture & {
			subjects: Subject[];
		};
	};

	const { issues, subjects, graph, lectures, lecture }: Props = $props();

	class MoveToLecture {
		lecture = $state('');
	}
</script>

<div class="rounded bg-purple-100">
	{#each lecture.subjects as subject (subject.id)}
		{@const subjectIssues = issues[subject.id] || []}
		{@const subjectToLecture = lectures.filter((lect) => {
			if (lecture.id === lect.id) return false;
			const subjectInLecture = lect.subjects.find((sub) => sub.id === subject.id);
			return !subjectInLecture;
		})}
		{@const moveToLecture = new MoveToLecture()}

		<div class="flex w-full items-center gap-2 rounded bg-purple-50/30 p-2 backdrop-blur-sm">
			<span class="w-full"> {subject.name} </span>
			<IssueIndicator issues={subjectIssues} />

			{#if subjectToLecture.length > 0}
				<Popover.Root>
					<Popover.Trigger class={cn(buttonVariants({ variant: 'outline' }))}>
						<Replace /> Other lecture
					</Popover.Trigger>
					<Popover.Content>
						<p class="mb-2 font-mono text-sm font-bold">Move subject to lecture:</p>

						<form
							{...moveSubjectToLecture.enhance(async ({ form, submit }) => {
								try {
									await submit().updates(getGraph(graph.id));
									if (moveSubjectToLecture.fields.allIssues()?.length) return;

									form.reset();
									toast.success('Subject moved successfully!');
								} catch (e) {
									toast.error(JSON.stringify(e));
								}
							})}
						>
							<input
								hidden
								{...moveSubjectToLecture.fields.graphId.as('number')}
								value={graph.id}
							/>
							<input
								hidden
								{...moveSubjectToLecture.fields.lectureId.as('number')}
								value={lecture.id}
							/>
							<input
								hidden
								{...moveSubjectToLecture.fields.subjectId.as('number')}
								value={subject.id}
							/>

							<Select.Root type="single" bind:value={moveToLecture.lecture}>
								<input
									hidden
									{...moveSubjectToLecture.fields.newLectureId.as('number')}
									value={Number(moveToLecture.lecture)}
								/>
								<Select.Trigger id="subject-select" class="mb-2">
									{lectures.find((lecture) => lecture.id === Number(moveToLecture.lecture))?.name ||
										'Select Lecture'}
								</Select.Trigger>
								<Select.Content>
									{#each subjectToLecture as lecture (lecture.id)}
										<Select.Item label={lecture.name} value={String(lecture.id)} />
									{/each}
								</Select.Content>
							</Select.Root>

							<Field.Submit
								form={moveSubjectToLecture}
								disabled={!moveToLecture.lecture}
								submitTitle="Change to Lecture"
								loadingTitle="Changing Subject..."
								hideCancel
							/>
						</form>
					</Popover.Content>
				</Popover.Root>
			{/if}
		</div>
	{:else}
		<p class="p-2 items-center">
			{#if subjects.length > 0}
				Add subject by clicking the <span
					class="border-sm h-6 gap-1 text-xs rounded bg-purple-200 p-1 inline-flex items-center"
					><Plus class="size-3" /> Add Subjects</span
				> button.
			{:else}
				No subjects, add one first in the subjects view.
			{/if}
		</p>
	{/each}
</div>
