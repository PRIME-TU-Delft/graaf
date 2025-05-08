<script lang="ts">
	import { goto } from '$app/navigation';
	import * as settings from '$lib/settings';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import { useId } from 'bits-ui';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import ChangeDomain from './ChangeDomain.svelte';
	import CreateNewDomain from './CreateNewDomain.svelte';
	import CreateNewRelationship from './CreateNewDomainRel.svelte';

	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Grid from '$lib/components/ui/grid/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	import { enhance } from '$app/forms';
	import { graphD3Store } from '$lib/d3/graphD3.svelte';
	import { ChevronRight, Sparkles, Trash } from '@lucide/svelte';
	import type { Domain, DomainStyle } from '@prisma/client';
	import type { PageData } from './$types';
	import ChangeDomainRel from './ChangeDomainRel.svelte';

	let { data }: { data: PageData } = $props();

	// This is a workaround for the fact that we can't use $derived due to the reordering
	let course = $state(data.course);
	$effect(() => {
		course = data.course;
	});

	let graph = $derived(data.course.graphs[0]);

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

	onMount(() => {
		if (data.cycles) {
			const from = data.cycles.source;
			const to = data.cycles.target;
			toast.warning('Graph contains a domain cycle', {
				duration: Number.POSITIVE_INFINITY,
				description: `from ${from.name} to ${to.name}`,
				action: {
					label: 'Go to cycle',
					onClick: () => {
						goto(`#rel-${from.id}-${to.id}`);
					}
				}
			});
		}
	});

	/**
	 * Handles the style change of a domain in domainColor snippet
	 * @param key - The style key
	 * @param domainIndex - The index of the domain
	 */

	async function handleChangeStyle(
		key: DomainStyle | null,
		domainIndex: number,
		triggerId: string,
		isOpenState: ChangeStyleOpenState
	) {
		const domain = course.graphs[0].domains[domainIndex];
		domain.style = key;

		const response = await fetch('/api/domains/style', {
			method: 'PATCH',
			body: JSON.stringify({ domainId: domain.id, style: key }),
			headers: { 'content-type': 'application/json' }
		});

		if (!response.ok) {
			toast.error('Failed to update domain style, try again later');
			return;
		} else {
			graphD3Store.graphD3?.setData(course.graphs[0]);
			graphD3Store.graphD3?.updateDomain(domain.id);

			closeAndFocusTrigger(triggerId, () => {
				isOpenState.isOpen = false;
			});
		}
	}

	function handleDndConsider(e: CustomEvent<{ items: (typeof graph)['domains'] }>) {
		course.graphs[0].domains = e.detail.items;
	}
	async function handleDndFinalize(e: CustomEvent<{ items: (typeof graph)['domains'] }>) {
		course.graphs[0].domains = e.detail.items;

		const body = course.graphs[0].domains.map((domain, index) => ({
			domainId: domain.id,
			newOrder: index
		}));

		const response = await fetch('/api/domains/order', {
			method: 'PATCH',
			body: JSON.stringify(body),
			headers: { 'content-type': 'application/json' }
		});

		if (!response.ok) {
			// Reset the order of the domains
			course.graphs[0].domains = course.graphs[0].domains.toSorted((a, b) => a.order - b.order);

			toast.error('Failed to update domain order, try again later!');
		} else {
			// Update the order of the domains in the graph
			course.graphs[0].domains.forEach((domain, index) => {
				domain.order = index;
			});
		}
	}
</script>

<CreateNewDomain {graph} />

<Grid.Root columnTemplate={['3rem', 'minmax(12rem, 1fr)', '5rem', '5rem']}>
	<div class="col-span-full grid grid-cols-subgrid border-b font-mono text-sm font-bold">
		<div class="p-2"></div>
		<div class="p-2">Name</div>
		<div class="p-2">Style</div>
		<div class="p-2 text-right">Settings</div>
	</div>

	<Grid.ReorderRows
		name="domain"
		items={course.graphs[0].domains}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
	>
		{#snippet children(domain, index)}
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
			<div class="p-2">Subject from</div>
			<div class="p-2">Subject to</div>
			<div class="p-2 text-right">Delete</div>
		</div>

		<Grid.Rows name="subject-rel" items={domainMapping} class="space-y-1">
			{#snippet children({ id, domain, outDomain }, index)}
				<Grid.Cell>
					{index + 1}
				</Grid.Cell>

				<Grid.Cell>
					{@render domainRelation('domain', domain, outDomain)}
				</Grid.Cell>
				<Grid.Cell>
					{@render domainRelation('outDomain', domain, outDomain)}
				</Grid.Cell>
				<Grid.Cell class="justify-end">
					{@render deleteDomainRel(domain, outDomain)}
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
						class="absolute left-1/2 top-1/2 h-1 w-3 -translate-x-1/2 -translate-y-1/2 -rotate-[60deg] rounded-full bg-gray-500/30"
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
	type: 'domain' | 'outDomain' = 'domain',
	domain: Domain,
	outDomain: Domain
)}
	{@const thisDomain = type == 'domain' ? domain : outDomain}

	<DropdownMenu.Root>
		<DropdownMenu.Trigger class={cn(buttonVariants({ variant: 'outline' }))}>
			{thisDomain.name}
			<ChevronRight />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="max-h-96 max-w-64 overflow-y-auto p-0">
			<DropdownMenu.Group class="sticky top-0 z-10 mt-2 bg-white/90 backdrop-blur-md">
				<a href="#domain-{thisDomain.id}">
					<DropdownMenu.Item>
						<Sparkles />
						Highlight {thisDomain.name}
					</DropdownMenu.Item>
				</a>
				<DropdownMenu.Separator />
			</DropdownMenu.Group>

			<DropdownMenu.Group>
				<DropdownMenu.GroupHeading>
					Change {thisDomain.name} to:
				</DropdownMenu.GroupHeading>

				<ChangeDomainRel {graph} inDomain={domain} {outDomain} {type} />
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet deleteDomainRel(domain: Domain, outDomain: Domain)}
	<Popover.Root>
		<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
			<Trash />
		</Popover.Trigger>
		<Popover.Content side="right" class="space-y-1">
			<form action="?/delete-domain-rel" method="POST" use:enhance>
				<input type="hidden" name="sourceDomainId" value={domain.id} />
				<input type="hidden" name="targetDomainId" value={outDomain.id} />

				<p class="mb-2">Are you sure you would like to delete this relationship</p>
				<Form.Button variant="destructive" type="submit">Yes, delete</Form.Button>
			</form>
		</Popover.Content>
	</Popover.Root>
{/snippet}
