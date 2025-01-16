<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as settings from '$lib/utils/settings';
	import type { domainRelSchema, domainSchema } from '$lib/zod/domainSubjectSchema';
	import type { Domain } from '@prisma/client';
	import MoveVertical from 'lucide-svelte/icons/move-vertical';
	import { toast } from 'svelte-sonner';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import ChangeDomain from './ChangeDomain.svelte';
	import CreateNewDomain from './CreateNewDomain.svelte';
	import CreateNewRelationship from './CreateNewDomainRel.svelte';
	import DomainRelSettings from './DomainRelSettings.svelte';
	import SortableList from './SortableList.svelte';

	type Props = {
		course: PageData['course'];

		newDomainForm: SuperValidated<Infer<typeof domainSchema>>;
		newDomainRelForm: SuperValidated<Infer<typeof domainRelSchema>>;
	};

	let { course, newDomainForm, newDomainRelForm }: Props = $props();

	const graph = $derived(course.graphs[0]);

	const domainMapping = $derived.by(() => {
		const map: { domain: Domain; outDomain: Domain }[] = [];
		for (const domain of graph.domains) {
			for (const outDomain of domain.outgoingDomains) {
				map.push({ domain, outDomain });
			}
		}
		return map;
	});

	// TODO: check if there are no dangling in/out domains
</script>

<div class="flex items-end justify-between">
	<h2 class="m-0">Domains</h2>
	<CreateNewDomain {graph} form={newDomainForm} />
</div>

<Table.Root class="mt-2">
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-12"></Table.Head>
			<Table.Head class="max-w-12">Name</Table.Head>
			<Table.Head>Color</Table.Head>
			<Table.Head>#In/Out</Table.Head>
			<Table.Head>Settings</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		<SortableList
			list={graph.domains}
			onrearrange={(list) => console.log($state.snapshot(list))}
			useId={(domain) => `${domain.id}-${domain.name}`}
		>
			{#snippet children(domain, index)}
				<Table.Cell class="px-1">
					<Button variant="secondary" onclick={() => toast.warning('Not implemented')}>
						<MoveVertical />
					</Button>
				</Table.Cell>
				<Table.Cell class="max-w-40 overflow-hidden text-ellipsis text-nowrap">
					{domain.id}
					{domain.name}
				</Table.Cell>
				<Table.Cell>
					{#if domain.style}
						<div
							class="h-5 w-5 rounded-full border-2 border-slate-600"
							style="background-color: {settings.COLORS[domain.style]}f0"
						></div>
					{:else}
						None
					{/if}
				</Table.Cell>
				<Table.Cell>{domain.incommingDomains.length}/{domain.outgoingDomains.length}</Table.Cell>
				<Table.Cell>
					<ChangeDomain {graph} {domain} />
				</Table.Cell>
			{/snippet}
		</SortableList>
	</Table.Body>
</Table.Root>

<div class="mt-12 flex items-end justify-between">
	<h2 class="m-0">Relationship</h2>
	<CreateNewRelationship {graph} form={newDomainRelForm} />
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
					page.url.hash == `#${id}` ? 'bg-blue-200' : 'bg-blue-200/0'
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
					<CreateNewRelationship {graph} form={newDomainRelForm} />
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>

<div class="h-dvh"></div>

<style>
	:global(.dragging) {
		@apply opacity-50 shadow-lg ring-2 ring-blue-400;
	}
</style>
