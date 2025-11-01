<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Issues, PrismaGraphPayload } from '$lib/validators/types';

	import IssueIndicator from '../IssueIndicator.svelte';
	import ChangeDomainRel from './ChangeDomainRel.svelte';
	import CreateNewDomain from './CreateNewDomain.svelte';
	import CreateNewRelationship from './CreateNewDomainRel.svelte';
	import DeleteDomainRel from './DeleteDomainRel.svelte';

	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Grid from '$lib/components/ui/grid/index.js';

	import { ChevronRight, Sparkles } from '@lucide/svelte';
	import type { Domain } from '@prisma/client';
	import DomainList from './DomainList.svelte';

	type Props = {
		graphValidator: {
			graph: PrismaGraphPayload;
			issues: Issues;
		};
	};

	const { graphValidator }: Props = $props();

	const domainMapping = $derived.by(() => {
		const map: { id: string; domain: Domain; outDomain: Domain }[] = [];
		for (const domain of graphValidator.graph.domains) {
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

	class OpenState {
		isOpen = $state(false);
	}
</script>

<CreateNewDomain graph={graphValidator.graph} />

<DomainList graph={graphValidator.graph} issues={graphValidator.issues} />

{#if graphValidator.graph.domains.length == 0}
	<p class="mt-2 w-full p-3 text-center text-sm text-gray-500">
		No domains found. Create a new domain to start.
	</p>
{:else}
	<CreateNewRelationship graph={graphValidator.graph} />

	<Grid.Root columnTemplate={['3rem', 'minmax(12rem, 1fr)', 'minmax(12rem, 1fr)', '5rem']}>
		<div class="col-span-full grid grid-cols-subgrid border-b font-mono text-sm font-bold">
			<div class="p-2"></div>
			<div class="p-2">Source</div>
			<div class="p-2">Target</div>
			<div class="p-2 text-right">Delete</div>
		</div>

		<Grid.Rows name="subject-rel" items={domainMapping} class="mt-2 space-y-1">
			{#snippet children({ domain: sourceDomain, outDomain: targetDomain })}
				<Grid.Cell>
					{@const issues =
						graphValidator.issues.domainRelationIssues[sourceDomain.id]?.[targetDomain.id] || []}
					<IssueIndicator {issues} />
				</Grid.Cell>

				<Grid.Cell>
					{@render domainRelation('sourceDomain', sourceDomain, targetDomain)}
				</Grid.Cell>
				<Grid.Cell>
					{@render domainRelation('targetDomain', sourceDomain, targetDomain)}
				</Grid.Cell>
				<Grid.Cell class="justify-end">
					<DeleteDomainRel graph={graphValidator.graph} {sourceDomain} {targetDomain} />
				</Grid.Cell>
			{/snippet}
		</Grid.Rows>
	</Grid.Root>
{/if}

{#snippet domainRelation(
	type: 'sourceDomain' | 'targetDomain' = 'sourceDomain',
	sourceDomain: Domain,
	targetDomain: Domain
)}
	{@const thisDomain = type == 'sourceDomain' ? sourceDomain : targetDomain}
	{@const changeDomainOpen = new OpenState()}

	<DropdownMenu.Root bind:open={changeDomainOpen.isOpen}>
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

			{@const otherDomains = graphValidator.graph.domains.filter(
				(domain) => domain.id != sourceDomain.id && domain.id != targetDomain.id
			)}

			{#if otherDomains.length > 0}
				<DropdownMenu.Group>
					<DropdownMenu.GroupHeading>
						Set {type == 'sourceDomain' ? 'source' : 'target'} domain
					</DropdownMenu.GroupHeading>

					{#each otherDomains as domain (domain.id)}
						<DropdownMenu.Item class="p-0">
							<ChangeDomainRel
								graph={graphValidator.graph}
								{domain}
								{sourceDomain}
								{targetDomain}
								{type}
								onclose={() => {
									changeDomainOpen.isOpen = false;
								}}
							/>
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Group>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}
