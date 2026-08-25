<script lang="ts">
	import * as settings from '$lib/settings';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import { getGraphStore } from '$lib/graph/graphStore.svelte';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';

	import ChangeDomain from './ChangeDomain.svelte';
	import CreateNewDomain from './CreateNewDomain.svelte';
	import CreateNewRelationship from './CreateNewDomainRel.svelte';

	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Grid from '$lib/components/ui/grid/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	import { ChevronRight, Sparkles } from '@lucide/svelte';
	import type { Domain, DomainStyle } from '@prisma/client';
	import IssueIndicator from '../IssueIndicator.svelte';
	import type { PageData } from './$types';
	import ChangeDomainRel from './ChangeDomainRel.svelte';
	import DeleteDomainRel from './DeleteDomainRel.svelte';

	let { data }: { data: PageData } = $props();

	// The graph store owns this graph: the table reads its projection and every change to a domain
	// is applied there, which is what keeps the preview canvas in step without a second write.
	const store = getGraphStore();
	const graph = $derived(store.graph);
	const issues = $derived(store.issues);

	function failedReorder() {
		store.revertOrder('domains');
		toast.error('Failed to update domain order, try again later!');
	}

	// No invalidateAll: the store already carries the new order, and domain order is not something
	// the canvas draws anyway.
	// svelte-ignore state_referenced_locally
	const {
		form: reorderData,
		enhance: reorderEnhance,
		submit: submitReorder
	} = superForm(data.reorderDomainsForm, {
		id: 'reorder-domains',
		dataType: 'json',
		invalidateAll: false,
		applyAction: false,
		resetForm: false,
		onUpdated: ({ form }) => {
			if (form.valid) store.confirmOrder('domains');
			else failedReorder();
		},
		onError: failedReorder
	});

	// The domain being restyled and how to close the popover it was picked in, until the server
	// answers. The previous style is the store's business, not this component's.
	let pendingStyle: { id: number; close: () => void } | null = null;

	function failedStyle() {
		if (pendingStyle) store.revertDomainStyle(pendingStyle.id);
		pendingStyle = null;
		toast.error('Failed to update domain style, try again later');
	}

	// No invalidateAll: applying the style to the store already restyled the node, the edges
	// leaving it and the subjects that inherit it, so there is nothing a refetch would add.
	// svelte-ignore state_referenced_locally
	const {
		form: styleData,
		enhance: styleEnhance,
		submit: submitStyle
	} = superForm(data.domainStyleForm, {
		id: 'change-domain-style',
		dataType: 'json',
		invalidateAll: false,
		applyAction: false,
		resetForm: false,
		onUpdated: ({ form }) => {
			if (!form.valid) return failedStyle();
			if (!pendingStyle) return;

			store.confirmDomainStyle(pendingStyle.id);
			pendingStyle.close();
			pendingStyle = null;
		},
		onError: failedStyle
	});

	const domainMapping = $derived.by(() => {
		const map: { id: string; domain: Domain; outDomain: Domain }[] = [];
		for (const domain of graph.domains) {
			for (const targetDomain of domain.targetDomains) {
				map.push({
					id: `domain-rel-${domain.id}-${targetDomain.id}`,
					domain,
					outDomain: targetDomain
				});
			}
		}
		return map;
	});

	class ChangeStyleOpenState {
		isOpen = $state(false);
	}

	/**
	 * Handles the style change of a domain in domainColor snippet
	 * @param key - The style key
	 * @param domainIndex - The index of the domain
	 */

	function handleChangeStyle(
		key: DomainStyle | null,
		domainIndex: number,
		triggerId: string,
		isOpenState: ChangeStyleOpenState
	) {
		const domain = graph.domains[domainIndex];

		pendingStyle = {
			id: domain.id,
			close: () =>
				closeAndFocusTrigger(triggerId, () => {
					isOpenState.isOpen = false;
				})
		};

		store.setDomainStyle(domain.id, key);

		$styleData = { graphId: graph.id, domainId: domain.id, style: key ?? '' };
		submitStyle();
	}

	function handleDndConsider(e: CustomEvent<{ items: { id: number }[] }>) {
		store.previewOrder('domains', idsOf(e.detail.items));
	}

	function handleDndFinalize(e: CustomEvent<{ items: { id: number }[] }>) {
		const domainIds = idsOf(e.detail.items);
		store.applyOrder('domains', domainIds);

		$reorderData = { graphId: graph.id, domainIds };
		submitReorder();
	}

	function idsOf(items: { id: number }[]) {
		return items.map((item) => item.id);
	}
</script>

<form method="POST" action="?/reorder-domains" use:reorderEnhance hidden></form>
<form method="POST" action="?/change-domain-style" use:styleEnhance hidden></form>

<svelte:head>
	<title>{graph.name} Domains | PRIME Graph Editor</title>
</svelte:head>

<CreateNewDomain {graph} />

<Grid.Root columnTemplate={['3rem', '3rem', 'minmax(12rem, 1fr)', '5rem', '5rem']}>
	<div class="col-span-full grid grid-cols-subgrid border-b font-mono text-sm font-bold">
		<div class="p-2"></div>
		<div class="p-2"></div>
		<div class="p-2">Name</div>
		<div class="p-2">Style</div>
		<div class="p-2 text-right">Settings</div>
	</div>

	<Grid.ReorderRows
		name="domain"
		items={graph.domains}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
	>
		{#snippet children(domain, index)}
			<Grid.Cell>
				{@const domainIssues = issues.domainIssues[domain.id] || []}
				<IssueIndicator issues={domainIssues} />
			</Grid.Cell>

			<Grid.Cell>
				<p class="m-0 truncate">{domain.name}</p>
			</Grid.Cell>

			<Grid.Cell>
				{@render domainStyle(domain.style, index)}
			</Grid.Cell>

			<Grid.Cell>
				<ChangeDomain {graph} {domain} />
			</Grid.Cell>
		{/snippet}
	</Grid.ReorderRows>
</Grid.Root>

{#if graph.domains.length == 0}
	<p class="mt-2 w-full p-3 text-center text-sm text-gray-500">
		No domains found. Create a new domain to start.
	</p>
{:else}
	<CreateNewRelationship {graph} />

	<Grid.Root columnTemplate={['3rem', 'minmax(12rem, 1fr)', 'minmax(12rem, 1fr)', '5rem']}>
		<div class="col-span-full grid grid-cols-subgrid border-b font-mono text-sm font-bold">
			<div class="p-2"></div>
			<div class="p-2">Source</div>
			<div class="p-2">Target</div>
			<div class="p-2 text-right">Delete</div>
		</div>

		<Grid.Rows name="subject-rel" items={domainMapping} class="space-y-1">
			{#snippet children({ domain: sourceDomain, outDomain: targetDomain })}
				<Grid.Cell>
					{@const relationIssues =
						issues.domainRelationIssues[sourceDomain.id]?.[targetDomain.id] || []}
					<IssueIndicator issues={relationIssues} />
				</Grid.Cell>

				<Grid.Cell>
					{@render domainRelation('sourceDomain', sourceDomain, targetDomain)}
				</Grid.Cell>
				<Grid.Cell>
					{@render domainRelation('targetDomain', sourceDomain, targetDomain)}
				</Grid.Cell>
				<Grid.Cell class="justify-end">
					<DeleteDomainRel {graph} {sourceDomain} {targetDomain} />
				</Grid.Cell>
			{/snippet}
		</Grid.Rows>
	</Grid.Root>
{/if}

<!-- This snippet defines the style button in the Domains table. 
 ONCHANGE, it updates the UI locally, then updates the server -->
{#snippet domainStyle(style: string | null, domainIndex: number)}
	{@const color = style ? settings.COLORS[style as keyof typeof settings.COLORS] : '#cccccc'}
	{@const triggerId = `style-trigger-${useId()}`}
	{@const isOpenState = new ChangeStyleOpenState()}

	<Popover.Root bind:open={isOpenState.isOpen}>
		<Popover.Trigger class="interactive" id={triggerId}>
			<div
				class="relative h-6 w-6 scale-100 rounded-full shadow-none transition-all duration-300 hover:scale-110 hover:shadow-lg"
				style="background: {color}90; border: 2px solid {color};"
			>
				{#if style == null}
					<div
						class="absolute top-1/2 left-1/2 h-1 w-3 -translate-x-1/2 -translate-y-1/2 -rotate-[60deg] rounded-full bg-gray-500/30"
					></div>
				{/if}
			</div>
		</Popover.Trigger>
		<Popover.Content side="right" class="space-y-1">
			<p class="font-bold">Change style</p>
			<p class="pb-4 text-xs text-gray-700">For domain: {graph.domains[domainIndex].name}</p>
			<Button
				variant="outline"
				class={cn(
					'flex w-full items-center border-0 border-purple-900 p-1 transition-all hover:bg-purple-200/50 focus:bg-purple-200/50',
					{
						'border-2 bg-purple-200/30': style == null
					}
				)}
				onclick={() => handleChangeStyle(null, domainIndex, triggerId, isOpenState)}
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
							'border-2 bg-purple-200/30': style == key
						}
					)}
					onclick={() => handleChangeStyle(key, domainIndex, triggerId, isOpenState)}
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

{#snippet domainRelation(
	type: 'sourceDomain' | 'targetDomain' = 'sourceDomain',
	sourceDomain: Domain,
	targetDomain: Domain
)}
	{@const thisDomain = type == 'sourceDomain' ? sourceDomain : targetDomain}

	<DropdownMenu.Root>
		<DropdownMenu.Trigger class={cn('relative w-full', buttonVariants({ variant: 'outline' }))}>
			<span class="w-full text-left">{thisDomain.name}</span>
			<ChevronRight />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="max-h-96 max-w-64 overflow-y-auto p-0">
			<DropdownMenu.Group class="sticky top-0 z-10">
				<a href="#domain-{thisDomain.id}">
					<DropdownMenu.Item
						class={cn('w-full justify-start', buttonVariants({ variant: 'ghost' }))}
					>
						<Sparkles />
						Highlight {thisDomain.name}
					</DropdownMenu.Item>
				</a>
				<DropdownMenu.Separator />
			</DropdownMenu.Group>

			{@const otherDomains = graph.domains.filter(
				(domain) => domain.id != sourceDomain.id && domain.id != targetDomain.id
			)}

			{#if otherDomains.length > 0}
				<DropdownMenu.Group>
					<DropdownMenu.GroupHeading>
						Set {type == 'sourceDomain' ? 'source' : 'target'} domain
					</DropdownMenu.GroupHeading>

					{#each otherDomains as domain (domain.id)}
						<ChangeDomainRel {graph} {domain} {sourceDomain} {targetDomain} {type} />
					{/each}
				</DropdownMenu.Group>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}
