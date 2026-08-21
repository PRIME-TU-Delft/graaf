<script lang="ts">
	import { getGraphStore } from '$lib/graph/graphStore.svelte';
	import type { Issue } from '$lib/validators/types';
	import { MoveVertical, Plus } from '@lucide/svelte';
	import type { Lecture, Subject } from '@prisma/client';
	import { dragHandle, dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import IssueIndicator from '../IssueIndicator.svelte';

	type Props = {
		issues: { [key: number]: Issue[] };
		subjects: Subject[];
		lecture: Lecture & {
			subjects: Subject[];
		};
	};

	const { subjects, issues, lecture }: Props = $props();

	// This component renders the store's membership for one lecture and hands drags back to it, so
	// the lectures view of the canvas repartitions without waiting for a reload
	const store = getGraphStore();

	const flipDurationMs = 300;

	function handleDndConsider(e: CustomEvent<DndEvent<Subject>>): void {
		store.previewLectureSubjects(lecture.id, idsOf(e.detail.items));
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<Subject>>) {
		// Reordering subjects within one lecture is not persisted, only moves between lectures are
		if (e.detail.items.length === store.committedSubjectIdsOf(lecture.id).length) {
			store.revertLectureSubjects(lecture.id);
			return;
		}

		store.commitLectureSubjects(lecture.id, idsOf(e.detail.items));
	}

	function idsOf(items: { id: number }[]) {
		return items.map((item) => item.id);
	}
</script>

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
