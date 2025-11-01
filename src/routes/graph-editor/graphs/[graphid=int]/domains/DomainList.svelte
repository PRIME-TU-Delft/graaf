<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as settings from '$lib/settings';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
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
	import type { Domain, DomainStyle } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import IssueIndicator from '../IssueIndicator.svelte';
	import ChangeDomain from './ChangeDomain.svelte';
	import DomainListItem from './DomainListItem.svelte';
	import { changeColor, reorderDomains } from './domain.remote';
	import { getGraph } from '../../graph.remote';

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

	let domains = $derived(graph.domains.slice());
	let activeId: number | null = $state(null);

	function handleDragStart(event: DragStartEvent) {
		activeId = event.active.id as number;
	}

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		activeId = null;

		if (!over) return;

		if (active.id !== over.id) {
			const oldIndex = domains.findIndex((t) => t.id === (active.id as number));
			const newIndex = domains.findIndex((t) => t.id === (over.id as number));

			if (oldIndex !== -1 && newIndex !== -1) {
				domains = arrayMove(domains, oldIndex, newIndex);
				domains = domains.map((domain, index) => ({ ...domain, order: index }));

				try {
					await reorderDomains({
						graphId: graph.id,
						domains: domains.map((domain) => ({ id: domain.id, order: domain.order }))
					});
				} catch {
					toast.error('Failed to reorder subjects');
				}
			}
		}
	}

	/**
	 * Handles the style change of a domain in domainColor snippet
	 * @param key - The style key
	 * @param domainIndex - The index of the domain
	 */

	async function handleChangeStyle(
		key: DomainStyle | null,
		domain: Domain,
		triggerId: string,
		isOpenState: ChangeStyleOpenState
	) {
		try {
			await changeColor({
				graphId: graph.id,
				domainId: domain.id,
				style: key
			}).updates(getGraph(graph.id));

			closeAndFocusTrigger(triggerId, () => {
				isOpenState.isOpen = false;
			});
		} catch {
			toast.error('Failed to change color');
		}
	}

	class ChangeStyleOpenState {
		isOpen = $state(false);
	}
</script>

<DndContext {sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
	<SortableContext items={domains}>
		<div class="flex gap-2 border-b text-sm">
			<div class="pl-14 font-mono font-bold">Name</div>
			<div class="grow"></div>
			<div class="pr-2 font-mono font-bold">Style</div>
			<div class="pr-3 font-mono font-bold">Edit</div>
		</div>

		{#each domains as domain (domain.id)}
			<DomainListItem {domain}>
				{@render domainItem(domain)}
			</DomainListItem>
		{/each}
	</SortableContext>

	<!-- The item when being dragged -->
	<DragOverlay>
		{#if activeId}
			{#each domains.filter((t) => t.id === activeId) as activeTask (activeTask.id)}
				<div class="flex w-full items-center gap-2 rounded bg-white px-2 py-0">
					<div class="cursor-pointer px-2 py-4 text-gray-500">
						<GripVertical />
					</div>
					{@render domainItem(activeTask)}
				</div>
			{/each}
		{/if}
	</DragOverlay>
</DndContext>

<!-- The content rendered when being static or being dragged -->
{#snippet domainItem(domain: PrismaGraphPayload['domains'][number])}
	<IssueIndicator issues={issues.domainIssues[domain.id] || []} />

	<p class="grow truncate">{domain.name}</p>

	{@render domainStyle(domain)}

	<ChangeDomain {domain} {graph} />
{/snippet}

<!-- This snippet defines the style button in the Domains table.
 ONCHANGE, it updates the UI locally, then updates the server -->
{#snippet domainStyle(domain: Domain)}
	{@const color = domain.style
		? settings.COLORS[domain.style as keyof typeof settings.COLORS]
		: '#cccccc'}
	{@const triggerId = `style-trigger-${useId()}`}
	{@const isOpenState = new ChangeStyleOpenState()}

	<Popover.Root bind:open={isOpenState.isOpen}>
		<Popover.Trigger class="mr-3 cursor-pointer" id={triggerId}>
			<div
				class="relative h-6 w-6 scale-100 rounded-full shadow-none transition-all duration-300 hover:scale-110 hover:shadow-lg"
				style="background: {color}90; border: 2px solid {color};"
			>
				{#if domain.style == null}
					<div
						class="absolute top-1/2 left-1/2 h-1 w-3 -translate-x-1/2 -translate-y-1/2 -rotate-60 rounded-full bg-gray-500/30"
					></div>
				{/if}
			</div>
		</Popover.Trigger>
		<Popover.Content side="right" class="space-y-1">
			<p class="font-bold">Change style</p>
			<p class="pb-4 text-xs text-gray-700">
				For domain: {domain.name}
			</p>
			<Button
				variant="outline"
				class={cn(
					'flex w-full items-center border-0 border-purple-900 p-1 transition-all hover:bg-purple-200/50 focus:bg-purple-200/50',
					{
						'border-2 bg-purple-200/30': domain.style == null
					}
				)}
				onclick={() => handleChangeStyle(null, domain, triggerId, isOpenState)}
			>
				<div
					style="border-color: {color}50; background: {color}30; border-width: 3px"
					class="h-6 w-6 rounded-full"
				></div>
				<p class="grow cursor-pointer p-2">None</p>
			</Button>

			{#each settings.COLOR_KEYS as key (key)}
				{@const color = settings.COLORS[key]}
				<Button
					variant="outline"
					class={cn(
						'flex w-full items-center border-0 border-purple-900 p-1 transition-all hover:bg-purple-200/50 focus:bg-purple-200/50',
						{
							'border-2 bg-purple-200/30': domain.style == key
						}
					)}
					onclick={() => handleChangeStyle(key, domain, triggerId, isOpenState)}
				>
					<div
						style="border-color: {color}; background: {color}50; border-width: 3px"
						class="h-6 w-6 rounded-full"
					></div>
					<p class="grow cursor-pointer p-2">{key.replaceAll('_', ' ').toLowerCase()}</p>
				</Button>
			{/each}
		</Popover.Content>
	</Popover.Root>
{/snippet}
