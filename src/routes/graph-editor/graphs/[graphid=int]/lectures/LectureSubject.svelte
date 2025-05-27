<script lang="ts">
	import { MoveVertical, Plus } from '@lucide/svelte';
	import type { Lecture, Subject } from '@prisma/client';
	import { dragHandle, dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';

	type Props = {
		subjects: Subject[];
		lecture: Lecture & {
			subjects: Subject[];
		};
	};

	const { subjects, lecture = $bindable() }: Props = $props();

	let subjectBackup = [...lecture.subjects];

	const flipDurationMs = 300;

	function handleDndConsider(e: CustomEvent<DndEvent<Subject>>): void {
		lecture.subjects = e.detail.items;
	}

	async function handleDndFinalize(e: CustomEvent<DndEvent<Subject>>) {
		// When there is a internal change of subject reorder
		if (subjectBackup.length === e.detail.items.length) {
			lecture.subjects = subjectBackup;
			return;
		}

		lecture.subjects = e.detail.items;

		const body = {
			name: lecture.name,
			graphId: lecture.graphId,
			lectureId: lecture.id,
			subjectIds: e.detail.items.map((subject) => subject.id)
		};

		const response = await fetch('/api/lectures/order-subjects', {
			method: 'PATCH',
			body: JSON.stringify(body),
			headers: { 'content-type': 'application/json' }
		});

		if (!response.ok) {
			lecture.subjects = subjectBackup;
			toast.error('Error while reordering lectures');
		} else {
			subjectBackup = lecture.subjects;
			console.log(lecture.subjects.map((subject) => subject.name));
		}
	}
</script>

<div
	class="min-h-8 space-y-2 rounded bg-purple-100 p-1 !outline-purple-400"
	use:dragHandleZone={{ items: lecture.subjects, flipDurationMs, type: 'subject' }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
>
	{#each lecture.subjects as subject (subject.id)}
		<div animate:flip={{ duration: flipDurationMs }} class="!outline-purple-50">
			<div class="flex w-full items-center rounded bg-purple-50/30 backdrop-blur-sm">
				<div
					class="m-2 rounded bg-purple-300 p-2 transition-colors hover:bg-purple-400"
					use:dragHandle
					aria-label="drag-handle for {lecture.id}"
				>
					<MoveVertical class="h-4 w-4" />
				</div>

				<p class="m-0 flex items-center gap-1">
					{subject.name}
				</p>
			</div>
		</div>
	{:else}
		<p class="m-0 items-center">
			{#if subjects.length > 0}
				Add subject by clicking the <span
					class="border-sm h-6 gap-1 text-xs rounded bg-purple-200 p-1 inline-flex items-center"
					><Plus class="size-3" /> Edit Subjects</span
				>, or by dragging another lecture's subject into this field
			{:else}
				No subjects, add one first in the subjects view.
			{/if}
		</p>
	{/each}
</div>
