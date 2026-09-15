<script lang="ts">
	import type { Issue } from '$lib/validators/types';
	import { MoveVertical, Plus } from '@lucide/svelte';
	import type { Lecture, Subject } from '@prisma/client';
	import { dragHandle, dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';
	import { page } from '$app/state';
	import { superForm } from 'sveltekit-superforms';
	import IssueIndicator from '../IssueIndicator.svelte';
	import type { PageData } from './$types';

	type Props = {
		issues: { [key: number]: Issue[] };
		subjects: Subject[];
		lecture: Lecture & {
			subjects: Subject[];
		};
	};

	const { subjects, issues, lecture = $bindable() }: Props = $props();

	let subjectBackup = [...lecture.subjects];

	const flipDurationMs = 300;

	function revertSubjectOrder() {
		lecture.subjects = subjectBackup;
		toast.error('Error while reordering lectures');
	}

	// Unlike the lecture list itself, this order does show up on the graph canvas: the lectures
	// view lays a lecture's subjects out in this order. So this form invalidates, and the canvas
	// picks the new order up from the refreshed payload.
	const {
		form: reorderData,
		enhance: reorderEnhance,
		submit: submitReorder
	} = superForm((page.data as PageData).reorderLectureSubjectsForm, {
		id: `reorder-lecture-subjects-${lecture.id}`,
		dataType: 'json',
		resetForm: false,
		onUpdated: ({ form }) => {
			if (form.valid) subjectBackup = [...lecture.subjects];
			else revertSubjectOrder();
		},
		onError: revertSubjectOrder
	});

	function handleDndConsider(e: CustomEvent<DndEvent<Subject>>): void {
		lecture.subjects = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<Subject>>) {
		lecture.subjects = e.detail.items;

		$reorderData = {
			graphId: lecture.graphId,
			lectureId: lecture.id,
			subjectIds: e.detail.items.map((subject) => subject.id)
		};
		submitReorder();
	}
</script>

<form method="POST" action="?/reorder-lecture-subjects" use:reorderEnhance hidden></form>

<div
	class="min-h-8 space-y-2 rounded bg-purple-100 p-1 !outline-purple-400"
	use:dragHandleZone={{ items: lecture.subjects, flipDurationMs, type: 'subject' }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
>
	{#each lecture.subjects as subject (subject.id)}
		{@const subjectIssues = issues[subject.id] || []}

		<div animate:flip={{ duration: flipDurationMs }} class="!outline-purple-50">
			<div class="flex w-full items-center gap-2 rounded bg-purple-50/30 p-2 backdrop-blur-sm">
				<div
					class="rounded bg-purple-300 p-2 transition-colors hover:bg-purple-400"
					use:dragHandle
					aria-label="drag-handle for {lecture.id}"
				>
					<MoveVertical class="h-4 w-4" />
				</div>

				<span class="w-full"> {subject.name} </span>
				<IssueIndicator issues={subjectIssues} />
			</div>
		</div>
	{:else}
		<p class="m-0 items-center">
			{#if subjects.length > 0}
				Add subject by clicking the <span
					class="border-sm inline-flex h-6 items-center gap-1 rounded bg-purple-200 p-1 text-xs"
					><Plus class="size-3" /> Edit Subjects</span
				>, or by dragging another lecture's subject into this field
			{:else}
				No subjects, add one first in the subjects view.
			{/if}
		</p>
	{/each}
</div>
