<script lang="ts">
	import * as settings from '$lib/settings';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { useId } from 'bits-ui';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import ChangeDomain from './ChangeDomain.svelte';
	import CreateNewDomain from './CreateNewDomain.svelte';
	import CreateNewRelationship from './CreateNewDomainRel.svelte';
	import DomainRelSettings from './DomainRelSettings.svelte';

	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button';
	import SortableList from '../SortableList.svelte';

	import MoveVertical from 'lucide-svelte/icons/move-vertical';

	import type { PageData } from './$types';
	import type { Domain, DomainStyle } from '@prisma/client';
	import type { DomainType } from '$lib/validators/graphValidator';
	import { graphD3Store } from '$lib/d3/graphD3.svelte';

	let { data }: { data: PageData } = $props();
	let graph = $state(data.graph);

	const domainMapping = $derived.by(() => {
		const map: { domain: Domain; outDomain: Domain }[] = [];
		for (const domain of graph.domains) {
			for (const targetDomain of domain.targetDomains) {
				map.push({ domain, outDomain: targetDomain });
			}
		}
		return map;
	});

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

	async function handleChangeStyle(key: DomainStyle | null, domainIndex: number) {
		const domain = graph.domains[domainIndex];
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
			graphD3Store.graphD3?.setData(graph);
			graphD3Store.graphD3?.updateDomain(domain.id);
		}
	}

	// Send a list of domains to the server to rearrange them
	async function handleRearrange(list: DomainType[]) {
		let body = list
			.filter((domain, index) => domain.order != index)
			.map((d, index) => {
				return {
					domainId: d.id,
					oldOrder: d.order,
					newOrder: index
				};
			});

		const response = await fetch('/api/domains/order', {
			method: 'PATCH',
			body: JSON.stringify(body),
			headers: { 'content-type': 'application/json' }
		});

		if (!response.ok) {
			toast.error('Failed to update domain order, try again later!');
			return;
		}

		graph.domains = list;
	}
</script>

<div class="flex items-end justify-between">
	<h2 class="m-0">Domains</h2>
	<CreateNewDomain {graph} />
</div>

<Table.Root class="mt-2">
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-12"></Table.Head>
			<Table.Head class="max-w-12 px-0">Name</Table.Head>
			<Table.Head>Style</Table.Head>
			<Table.Head class="text-right">Settings</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		<SortableList
			list={graph.domains}
			onrearrange={(list) => handleRearrange(list)}
			useId={(domain) => `${domain.id}-${domain.name}`}
		>
			{#snippet children(domain, index)}
				<Table.Cell class="px-1">
					<Button variant="secondary" onclick={() => toast.warning('Not implemented')}>
						<MoveVertical />
					</Button>
				</Table.Cell>
				<Table.Cell class="max-w-40 overflow-hidden text-ellipsis text-nowrap pr-0">
					{domain.name}
				</Table.Cell>
				<Table.Cell>
					{@render domainStyle(domain.style, index)}
				</Table.Cell>
				<Table.Cell>
					<ChangeDomain {graph} {domain} />
				</Table.Cell>
			{/snippet}
		</SortableList>
	</Table.Body>
</Table.Root>

<div class="mt-12 flex items-end justify-between">
	<h2 class="m-0">Relationship</h2>
	<CreateNewRelationship {graph} />
</div>
<Table.Root class="mt-2">
	<Table.Header>
		<Table.Row>
			<Table.Head></Table.Head>
			<Table.Head>Name</Table.Head>
			<Table.Head>Linked to</Table.Head>
			<Table.Head class="text-right">Settings</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each domainMapping as { domain, outDomain }, index (domain.id.toString() + outDomain.id.toString())}
			{@const id = `domain-rel-${domain.id}-${outDomain.id}`}
			<Table.Row
				{id}
				class={[
					'transition-colors delay-300',
					page.url.hash == `#${id}` ? 'bg-purple-200' : 'bg-purple-200/0'
				]}
			>
				<Table.Cell>
					{index + 1}
				</Table.Cell>
				<Table.Cell>
					<Button variant="secondary" href="#{domain.id}-{domain.name}">
						{domain.name}
					</Button>
				</Table.Cell>
				<Table.Cell>
					<Button variant="secondary" href="#{outDomain.id}-{outDomain.name}">
						{outDomain.name}
					</Button>
				</Table.Cell>
				<Table.Cell class="text-right">
					<DomainRelSettings {domain} {outDomain} {graph} />
				</Table.Cell>
			</Table.Row>
		{:else}
			<Table.Row>
				<Table.Cell colspan={2}>Create first domain relationship</Table.Cell>

				<Table.Cell colspan={2}>
					<CreateNewRelationship {graph} />
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>

<div class="h-dvh"></div>

<!-- This snippet defines the style button in the Domains table. 
 ONCHANGE, it updates the UI locally, then updates the server -->
{#snippet domainStyle(style: string | null, domainIndex: number)}
	{@const color = style ? settings.COLORS[style as keyof typeof settings.COLORS] : '#cccccc'}
	{@const triggerId = `style-trigger-${useId()}`}

	<Popover.Root>
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
				onclick={() => handleChangeStyle(null, domainIndex)}
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
					onclick={() => handleChangeStyle(key, domainIndex)}
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

<style lang="postcss">
	:global(.dragging) {
		@apply opacity-50 shadow-lg ring-2 ring-purple-400;
	}
</style>
