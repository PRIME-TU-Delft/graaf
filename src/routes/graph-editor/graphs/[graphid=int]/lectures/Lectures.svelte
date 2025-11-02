<script lang="ts">
	import SortableItem from '$lib/components/Reorder/SortableItem.svelte';
	import { sensors } from '$lib/components/Reorder/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils';
	import type { Issues, PrismaGraphPayload } from '$lib/validators/types';
	import {
		DndContext,
		DragOverlay,
		type DragEndEvent,
		type DragStartEvent
	} from '@dnd-kit-svelte/core';
	import { SortableContext, arrayMove } from '@dnd-kit-svelte/sortable';
	import { Ellipsis, GripVertical } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import IssueIndicator from '../IssueIndicator.svelte';
	import AddSubjectToLecture from './AddSubjectToLecture.svelte';
	import ChangeLecture from './ChangeLecture.svelte';
	import CreateNewLecture from './CreateNewLecture.svelte';
	import DeleteLecture from './DeleteLecture.svelte';
	import LectureSubject from './LectureSubject.svelte';
	import { reorderLectures } from './lecture.remote';

	type Props = {
		graphValidator: {
			graph: PrismaGraphPayload;
			issues: Issues;
		};
	};

	const { graphValidator }: Props = $props();

	let lectures = $derived(graphValidator.graph.lectures.slice());
	let activeId: number | null = $state(null);

	function handleDragStart(event: DragStartEvent) {
		activeId = event.active.id as number;
	}

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		activeId = null;

		if (!over) return;

		if (active.id !== over.id) {
			const oldIndex = lectures.findIndex((t) => t.id === (active.id as number));
			const newIndex = lectures.findIndex((t) => t.id === (over.id as number));

			if (oldIndex !== -1 && newIndex !== -1) {
				lectures = arrayMove(lectures, oldIndex, newIndex);
				lectures = lectures.map((lecture, index) => ({ ...lecture, order: index }));

				try {
					await reorderLectures({
						graphId: graphValidator.graph.id,
						lectures: lectures.map((subject) => ({
							lectureId: subject.id,
							newOrder: subject.order
						}))
					});
				} catch {
					toast.error('Failed to reorder subjects');
				}
			}
		}
	}

	class ChangeLectureClass {
		open = $state(false);
	}
</script>

<CreateNewLecture graph={graphValidator.graph} />

<DndContext {sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
	<SortableContext items={lectures}>
		<div class="space-y-2">
			{#each lectures as lecture (lecture.id)}
				<SortableItem name="lecture" id={lecture.id}>
					{@render lectureHead(lecture)}

					{#snippet after()}
						{@render lectureBody(lecture)}
					{/snippet}
				</SortableItem>
			{:else}
				<p class="mt-2 w-full p-3 text-center text-sm text-gray-500">
					No lectures found, create one with the button in the top right
				</p>
			{/each}
		</div>
	</SortableContext>

	<!-- The item when being dragged -->
	<DragOverlay>
		{#if activeId}
			{#each lectures.filter((t) => t.id === activeId) as activeTask (activeTask.id)}
				<div class="rounded outline-2 outline-purple-400">
					<div class="flex w-full items-center gap-2 rounded-t bg-purple-50 px-2 py-0">
						<div class="cursor-pointer px-2 py-4 text-gray-500">
							<GripVertical />
						</div>
						{@render lectureHead(activeTask)}
					</div>
					<div class="rounded-b bg-white">
						{@render lectureBody(activeTask)}
					</div>
				</div>
			{/each}
		{/if}
	</DragOverlay>
</DndContext>

{#snippet lectureHead(lecture: PrismaGraphPayload['lectures'][number])}
	{@const lectureIssues = graphValidator.issues.lectureIssues[lecture.id] || {
		lecture: [],
		subjects: {}
	}}
	{@const changeLecture = new ChangeLectureClass()}

	<p class="grow">{lecture.name}</p>
	<IssueIndicator issues={lectureIssues.lecture} />

	{#if graphValidator.graph.subjects.length > 0}
		<AddSubjectToLecture {lecture} graph={graphValidator.graph} />
	{/if}

	<DropdownMenu.Root bind:open={changeLecture.open}>
		<DropdownMenu.Trigger class={cn(buttonVariants({ variant: 'outline' }))}>
			<Ellipsis class="size-4 w-full" />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Item class="p-0">
				<ChangeLecture
					{lecture}
					graph={graphValidator.graph}
					onSuccess={() => (changeLecture.open = false)}
				/>
			</DropdownMenu.Item>

			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger class="font-bold text-red-700 hover:bg-red-100">
					Delete
				</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent class="ml-1">
					<DeleteLecture
						{lecture}
						graph={graphValidator.graph}
						onSuccess={() => (changeLecture.open = false)}
					/>
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet lectureBody(lecture: PrismaGraphPayload['lectures'][number])}
	{@const lectureIssues = graphValidator.issues.lectureIssues[lecture.id] || {
		lecture: [],
		subjects: {}
	}}
	<LectureSubject
		{lecture}
		lectures={graphValidator.graph.lectures}
		subjects={graphValidator.graph.subjects}
		issues={lectureIssues.subjects}
		graph={graphValidator.graph}
	/>
{/snippet}
