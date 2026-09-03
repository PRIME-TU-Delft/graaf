<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Grid from '$lib/components/ui/grid/index.js';

	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { getGraphStore } from '$lib/graph/graphStore.svelte';
	import { ChevronRight, Sparkles } from '@lucide/svelte';
	import type { Subject } from '@prisma/client';
	import Link from '@lucide/svelte/icons/link';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from './$types';

	import IssueIndicator from '../IssueIndicator.svelte';
	import ChangeDomainForSubject from './ChangeDomainForSubject.svelte';
	import ChangeSubject from './ChangeSubject.svelte';
	import ChangeSubjectRel from './ChangeSubjectRel.svelte';
	import CreateNewSubject from './CreateNewSubject.svelte';
	import CreateNewSubjectRel from './CreateNewSubjectRel.svelte';
	import DeleteSubjectRel from './DeleteSubjectRel.svelte';

	let { data }: { data: PageData } = $props();

	// The graph store owns this graph: the table reads its projection and reordering is applied
	// there, which is what keeps the preview canvas in step without a second write.
	const store = getGraphStore();
	const graph = $derived(store.graph);
	const issues = $derived(store.issues);

	function failedReorder() {
		store.revertOrder('subjects');
		toast.error('Failed to update subject order, try again later!');
	}

	// No invalidateAll: the store already carries the new order, and subject order is not something
	// the canvas draws anyway.
	// svelte-ignore state_referenced_locally
	const {
		form: reorderData,
		enhance: reorderEnhance,
		submit: submitReorder
	} = superForm(data.reorderSubjectsForm, {
		id: 'reorder-subjects',
		dataType: 'json',
		invalidateAll: false,
		applyAction: false,
		resetForm: false,
		onUpdated: ({ form }) => {
			if (form.valid) store.confirmOrder('subjects');
			else failedReorder();
		},
		onError: failedReorder
	});

	const subjectMapping = $derived.by(() => {
		const map: { id: string; sourceSubject: Subject; targetSubject: Subject }[] = [];
		for (const sourceSubject of graph.subjects) {
			for (const targetSubject of sourceSubject.targetSubjects) {
				map.push({
					id: `subject-rel-${sourceSubject.id}-${targetSubject.id}`,
					sourceSubject,
					targetSubject
				});
			}
		}
		return map;
	});

	function handleDndConsider(e: CustomEvent<{ items: { id: number }[] }>) {
		store.previewOrder('subjects', idsOf(e.detail.items));
	}

	function handleDndFinalize(e: CustomEvent<{ items: { id: number }[] }>) {
		const subjectIds = idsOf(e.detail.items);
		store.applyOrder('subjects', subjectIds);

		$reorderData = { graphId: graph.id, subjectIds };
		submitReorder();
	}

	function idsOf(items: { id: number }[]) {
		return items.map((item) => item.id);
	}
</script>

<form method="POST" action="?/reorder-subjects" use:reorderEnhance hidden></form>

<svelte:head>
	<title>{graph.name} Subjects | PRIME Graph Editor</title>
</svelte:head>

<CreateNewSubject {graph} />

<Grid.Root columnTemplate={['3rem', '3rem', 'minmax(12rem, 1fr)', 'minmax(12rem, 1fr)', '5rem']}>
	<div class="col-span-full grid grid-cols-subgrid border-b font-mono text-sm font-bold">
		<div class="p-2"></div>
		<div class="p-2"></div>
		<div class="p-2">Name</div>
		<div class="flex gap-2 p-2"><Link class="size-4" />Domain</div>
		<div class="p-2 text-right">Edit</div>
	</div>

	<Grid.ReorderRows
		name="subject"
		items={graph.subjects}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
	>
		{#snippet children(subject)}
			<Grid.Cell>
				{@const subjectIssues = issues.subjectIssues[subject.id] || []}
				<IssueIndicator issues={subjectIssues} />
			</Grid.Cell>

			<Grid.Cell>
				<p class="m-0 truncate" title={subject.name}>{subject.name}</p>
			</Grid.Cell>

			<Grid.Cell>
				<ChangeDomainForSubject {subject} {graph} />
			</Grid.Cell>

			<Grid.Cell>
				<ChangeSubject {subject} {graph} />
			</Grid.Cell>
		{/snippet}
	</Grid.ReorderRows>
</Grid.Root>

{#if graph.subjects.length == 0}
	<p class="mt-2 w-full p-3 text-center text-sm text-gray-500">No subjects found</p>
{:else}
	<CreateNewSubjectRel {graph} />

	<Grid.Root columnTemplate={['3rem', 'minmax(12rem, 1fr)', 'minmax(12rem, 1fr)', '5rem']}>
		<div class="col-span-full grid grid-cols-subgrid border-b font-mono text-sm font-bold">
			<div class="p-2"></div>
			<div class="p-2">Source</div>
			<div class="p-2">Target</div>
			<div class="p-2 text-right">Delete</div>
		</div>

		<Grid.Rows name="subject-rel" items={subjectMapping} class="space-y-1">
			{#snippet children({ sourceSubject, targetSubject })}
				<Grid.Cell>
					{@const relationIssues =
						issues.subjectRelationIssues[sourceSubject.id]?.[targetSubject.id] || []}
					<IssueIndicator issues={relationIssues} />
				</Grid.Cell>

				<Grid.Cell>
					{@render subjectRelation('sourceSubject', sourceSubject, targetSubject)}
				</Grid.Cell>
				<Grid.Cell>
					{@render subjectRelation('targetSubject', sourceSubject, targetSubject)}
				</Grid.Cell>
				<Grid.Cell class="justify-end">
					<DeleteSubjectRel {graph} {sourceSubject} {targetSubject} />
				</Grid.Cell>
			{/snippet}
		</Grid.Rows>
	</Grid.Root>
{/if}

{#snippet subjectRelation(
	type: 'sourceSubject' | 'targetSubject',
	sourceSubject: Subject,
	targetSubject: Subject
)}
	{@const thisSubject = type == 'sourceSubject' ? sourceSubject : targetSubject}

	<DropdownMenu.Root>
		<DropdownMenu.Trigger class={cn('relative w-full', buttonVariants({ variant: 'outline' }))}>
			<span class="min-w-0 flex-1 truncate text-left" title={thisSubject.name}>
				{thisSubject.name}
			</span>
			<ChevronRight />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="max-h-96 max-w-64 overflow-y-auto p-0">
			<DropdownMenu.Group class="sticky top-0 z-10">
				<a href="#subject-{thisSubject.id}">
					<DropdownMenu.Item
						class={cn('w-full justify-start', buttonVariants({ variant: 'ghost' }))}
					>
						<Sparkles />
						Highlight {thisSubject.name}
					</DropdownMenu.Item>
				</a>
				<DropdownMenu.Separator />
			</DropdownMenu.Group>

			{@const otherSubjects = graph.subjects.filter(
				(subject) => subject.id != sourceSubject.id && subject.id != targetSubject.id
			)}

			{#if otherSubjects.length > 0}
				<DropdownMenu.Group>
					<DropdownMenu.GroupHeading>
						Set {type == 'sourceSubject' ? 'source' : 'target'} subject
					</DropdownMenu.GroupHeading>

					{#each otherSubjects as subject (subject.id)}
						<ChangeSubjectRel {graph} {subject} {sourceSubject} {targetSubject} {type} />
					{/each}
				</DropdownMenu.Group>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}
