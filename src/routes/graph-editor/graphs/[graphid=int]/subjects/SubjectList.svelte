<script lang="ts">
	import type { Issues, PrismaGraphPayload } from '$lib/validators/types';
	import {
		DndContext,
		DragOverlay,
		KeyboardSensor,
		MouseSensor,
		TouchSensor,
		useSensor,
		useSensors,
		type DragEndEvent,
		type DragStartEvent
	} from '@dnd-kit-svelte/core';
	import { SortableContext, arrayMove } from '@dnd-kit-svelte/sortable';
	import { GripVertical } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import IssueIndicator from '../IssueIndicator.svelte';
	import ChangeDomainForSubject from './ChangeDomainForSubject.svelte';
	import ChangeSubject from './ChangeSubject.svelte';
	import SortableItem from './SubjectListItem.svelte';
	import { reorderSubjects } from './subjects.remote';

	type Props = {
		graph: PrismaGraphPayload;
		issues: Issues;
	};

	const { graph, issues }: Props = $props();

	export const sensors = useSensors(
		useSensor(TouchSensor),
		useSensor(KeyboardSensor),
		useSensor(MouseSensor)
	);

	let subjects = $derived(graph.subjects.slice());
	let activeId: number | null = $state(null);

	function handleDragStart(event: DragStartEvent) {
		activeId = event.active.id as number;
	}

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		activeId = null;

		if (!over) return;

		if (active.id !== over.id) {
			const oldIndex = subjects.findIndex((t) => t.id === (active.id as number));
			const newIndex = subjects.findIndex((t) => t.id === (over.id as number));

			if (oldIndex !== -1 && newIndex !== -1) {
				subjects = arrayMove(subjects, oldIndex, newIndex);
				subjects = subjects.map((subject, index) => ({ ...subject, order: index }));

				try {
					await reorderSubjects({
						graphId: graph.id,
						subjects: subjects.map((subject) => ({ id: subject.id, order: subject.order }))
					});
				} catch {
					toast.error('Failed to reorder subjects');
				}
			}
		}
	}
</script>

<DndContext {sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
	<SortableContext items={subjects}>
		<div class="flex gap-2 border-b text-sm">
			<div class="pl-14 font-mono font-bold">Name</div>
			<div class="grow"></div>
			<div class="font-mono font-bold">Linked Domain</div>
			<div class="pr-3 font-mono font-bold">Edit</div>
		</div>

		{#each subjects as subject (subject.id)}
			<SortableItem {subject}>
				{@render subjectItem(subject)}
			</SortableItem>
		{/each}
	</SortableContext>

	<!-- The item when being dragged -->
	<DragOverlay>
		{#if activeId}
			{#each subjects.filter((t) => t.id === activeId) as activeTask (activeTask.id)}
				<div class="flex w-full items-center gap-2 rounded bg-white px-2 py-0">
					<div class="cursor-pointer px-2 py-4 text-gray-500">
						<GripVertical />
					</div>
					{@render subjectItem(activeTask)}
				</div>
			{/each}
		{/if}
	</DragOverlay>
</DndContext>

<!-- The content rendered when being static or being dragged -->
{#snippet subjectItem(subject: PrismaGraphPayload['subjects'][number])}
	<IssueIndicator issues={issues.subjectIssues[subject.id] || []} />

	<p class="grow overflow-hidden text-ellipsis whitespace-nowrap">{subject.name}</p>

	<ChangeDomainForSubject {subject} {graph} />

	<ChangeSubject {subject} {graph} />
{/snippet}
