<script lang="ts">
	import { enhance } from '$app/forms';
	import { buttonVariants } from '$lib/components/ui/button';

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Grid from '$lib/components/ui/grid/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	import { cn } from '$lib/utils';
	import { ChevronRight, Sparkles, Trash } from '@lucide/svelte';
	import type { Subject } from '@prisma/client';
	import Link from 'lucide-svelte/icons/link';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	import ChangeDomainForSubject from './ChangeDomainForSubject.svelte';
	import ChangeSubject from './ChangeSubject.svelte';
	import ChangeSubjectRel from './ChangeSubjectRel.svelte';
	import CreateNewSubject from './CreateNewSubject.svelte';
	import CreateNewSubjectRel from './CreateNewSubjectRel.svelte';

	let { data }: { data: PageData } = $props();

	// This is a workaround for the fact that we can't use $derived due to the reordering
	let graph = $state(data.graph);
	$effect(() => {
		graph = data.graph;
	});

	type Graph = PageData['graph'];

	const subjectMapping = $derived.by(() => {
		const map: { id: string; subject: Subject; outSubject: Subject }[] = [];
		for (const subject of graph.subjects) {
			for (const targetSubject of subject.targetSubjects) {
				map.push({
					id: `subject-rel-${subject.id}-${targetSubject.id}`,
					subject,
					outSubject: targetSubject
				});
			}
		}
		return map;
	});

	function handleDndConsider(e: CustomEvent<{ items: Graph['subjects'] }>) {
		graph.subjects = e.detail.items;
	}

	async function handleDndFinalize(e: CustomEvent<{ items: Graph['subjects'] }>) {
		graph.subjects = e.detail.items;

		const body = graph.subjects.map((subject, index) => ({
			subjectId: subject.id,
			newOrder: index
		}));

		const response = await fetch('/api/subjects/order', {
			method: 'PATCH',
			body: JSON.stringify(body),
			headers: { 'content-type': 'application/json' }
		});

		if (!response.ok) {
			// Reset the order of the domains
			graph.subjects = graph.subjects.toSorted((a, b) => a.order - b.order);

			toast.error('Failed to update subject order, try again later!');
		} else {
			// Update the order of the domains in the graph
			graph.subjects.forEach((domain, index) => {
				domain.order = index;
			});
		}
	}
</script>

<CreateNewSubject {graph} />

<Grid.Root columnTemplate={['3rem', 'minmax(12rem, 1fr)', 'minmax(12rem, 1fr)', '5rem']}>
	<div class="col-span-full grid grid-cols-subgrid border-b font-mono text-sm font-bold">
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
				{subject.name}
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
			<div class="p-2">Subject from</div>
			<div class="p-2">Subject to</div>
			<div class="p-2 text-right">Delete</div>
		</div>

		<Grid.Rows name="subject-rel" items={subjectMapping} class="space-y-1">
			{#snippet children({ subject, outSubject }, index)}
				<Grid.Cell>
					{index + 1}
				</Grid.Cell>

				<Grid.Cell>
					{@render subjectRelation('subject', subject, outSubject)}
				</Grid.Cell>
				<Grid.Cell>
					{@render subjectRelation('outSubject', subject, outSubject)}
				</Grid.Cell>
				<Grid.Cell class="justify-end">
					{@render deleteSubjectRel(subject, outSubject)}
				</Grid.Cell>
			{/snippet}
		</Grid.Rows>
	</Grid.Root>
{/if}

{#snippet subjectRelation(type: 'subject' | 'outSubject', subject: Subject, outSubject: Subject)}
	{@const thisSubject = type == 'subject' ? subject : outSubject}

	<DropdownMenu.Root>
		<DropdownMenu.Trigger class={cn(buttonVariants({ variant: 'outline' }))}>
			{thisSubject.name}
			<ChevronRight />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="max-h-96 max-w-64 overflow-y-auto p-0">
			<DropdownMenu.Group class="sticky top-0 z-10 mt-2 bg-white/90 backdrop-blur-md">
				<a href="#subject-{thisSubject.id}">
					<DropdownMenu.Item>
						<Sparkles />
						Highlight {thisSubject.name}
					</DropdownMenu.Item>
				</a>
				<DropdownMenu.Separator />
			</DropdownMenu.Group>

			<DropdownMenu.Group>
				<DropdownMenu.GroupHeading>
					Change {thisSubject.name} to:
				</DropdownMenu.GroupHeading>

				<ChangeSubjectRel {graph} inSubject={subject} {outSubject} {type} />
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet deleteSubjectRel(subject: Subject, outSubject: Subject)}
	<Popover.Root>
		<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
			<Trash />
		</Popover.Trigger>
		<Popover.Content side="right" class="space-y-1">
			<form action="?/delete-subject-rel" method="POST" use:enhance>
				<input type="hidden" name="sourceSubjectId" value={subject.id} />
				<input type="hidden" name="targetSubjectId" value={outSubject.id} />

				<p class="mb-2">Are you sure you would like to delete this relationship</p>
				<Form.Button variant="destructive" type="submit">Yes, delete</Form.Button>
			</form>
		</Popover.Content>
	</Popover.Root>
{/snippet}
