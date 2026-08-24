<script lang="ts">
	import { buildLinkAnalytics } from '$lib/utils/linkAnalytics';

	// Components
	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button';
	import GraphSettings from '$lib/components/graphSettings/GraphSettings.svelte';
	import CreateLink from '$lib/components/graphSettings/CreateLink.svelte';
	import DeleteLink from '$lib/components/graphSettings/DeleteLink.svelte';
	import EmbedLink from '$lib/components/graphSettings/EmbedLink.svelte';
	import LinkAnalytics from '$lib/components/graphSettings/LinkAnalytics.svelte';
	import StaleLinkBadge from '$lib/components/graphSettings/StaleLinkBadge.svelte';

	// Icons
	import { Eye } from '@lucide/svelte';

	// Types
	import type { Prisma, Link } from '@prisma/client';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import type { graphSchemaWithId } from '$lib/zod/graphSchema';
	import type { editLinkSchema, newLinkSchema } from '$lib/zod/linkSchema';
	import type { LinkViewWeek } from '$lib/utils/linkAnalytics';

	type StaleFilter = 'all' | 'only-stale' | 'hide-stale';

	type GraphLinksProps = {
		graphs: Prisma.GraphGetPayload<{
			include: {
				lectures: true;
				links: true;
			};
		}>[];
		editGraphForm: SuperValidated<Infer<typeof graphSchemaWithId>>;
		newLinkForm: SuperValidated<Infer<typeof newLinkSchema>>;
		editLinkForm: SuperValidated<Infer<typeof editLinkSchema>>;
		getLinkURL: (link: Link) => string;
		hasAtLeastAdminPermission: boolean;
		linkViews: LinkViewWeek[];
	};

	const {
		graphs,
		editGraphForm,
		newLinkForm,
		editLinkForm,
		getLinkURL,
		hasAtLeastAdminPermission,
		linkViews
	}: GraphLinksProps = $props();

	const filters: { value: StaleFilter; label: string }[] = [
		{ value: 'all', label: 'All links' },
		{ value: 'only-stale', label: 'Only stale' },
		{ value: 'hide-stale', label: 'Hide stale' }
	];

	let staleFilter = $state<StaleFilter>('all');

	const analytics = $derived(
		buildLinkAnalytics(
			graphs.flatMap((graph) => graph.links),
			linkViews
		)
	);

	const staleCount = $derived([...analytics.values()].filter((views) => views.isStale).length);

	/** The links of one graph, minus the ones the stale filter hides. Runs on data that is already
	 * loaded, so switching the filter costs no query. */
	function visibleLinks(links: Link[]) {
		if (staleFilter === 'all') return links;

		return links.filter((link) => {
			const isStale = analytics.get(link.id)?.isStale ?? false;
			return staleFilter === 'only-stale' ? isStale : !isStale;
		});
	}
</script>

{#if analytics.size > 0}
	<div class="mb-2 flex flex-wrap items-center justify-between gap-2">
		<p class="!m-0 text-sm text-gray-500">
			{staleCount} of {analytics.size}
			{analytics.size == 1 ? 'link is' : 'links are'} stale
		</p>

		<div class="flex items-center gap-1">
			{#each filters as filter (filter.value)}
				<Button
					size="sm"
					variant={staleFilter == filter.value ? 'default' : 'outline'}
					aria-pressed={staleFilter == filter.value}
					onclick={() => (staleFilter = filter.value)}
				>
					{filter.label}
				</Button>
			{/each}
		</div>
	</div>
{/if}

<div class="rounded-md border">
	<!-- min-width keeps the rows readable on narrow screens: Table.Root's own container scrolls
	     instead of squeezing the link URL and the action buttons into each other -->
	<Table.Root class="!m-0 min-w-[42rem]">
		<Table.Header>
			<!-- Rows here are not clickable, so none of them tint on hover. Table.Row ships a hover
			     tint, which each row cancels by restating its own background for the hover state. -->
			<Table.Row class="hover:bg-transparent">
				<Table.Head class="w-full">Name</Table.Head>
				<Table.Head>Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each graphs as graph (graph.id)}
				<Table.Row class="p-0 hover:bg-transparent">
					<Table.Cell>
						{graph.name}
					</Table.Cell>
					<Table.Cell class="flex items-center justify-end gap-1">
						<CreateLink {graph} {newLinkForm} />
						<GraphSettings {graph} {editGraphForm} canDelete={hasAtLeastAdminPermission} />
					</Table.Cell>
				</Table.Row>

				{#each visibleLinks(graph.links) as link (link.id)}
					{@const linkAnalytics = analytics.get(link.id)}
					<Table.Row
						class="bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-50/50 odd:hover:bg-purple-100/50"
					>
						<Table.Cell class="pl-8 text-xs">
							<span class="block">{getLinkURL(link)}</span>
							<span class="mt-1 flex items-center gap-2 text-gray-500">
								<span class="flex items-center gap-1">
									<Eye class="size-3.5" />
									{link.viewCount}
									{link.viewCount == 1 ? 'view' : 'views'}
								</span>
								{#if linkAnalytics?.isStale}
									<StaleLinkBadge analytics={linkAnalytics} />
								{/if}
							</span>
						</Table.Cell>
						<Table.Cell class="flex items-center justify-end gap-1">
							{#if linkAnalytics}
								<LinkAnalytics {link} analytics={linkAnalytics} url={getLinkURL(link)} />
							{/if}
							<EmbedLink {link} {getLinkURL} lectures={graph.lectures} />
							{#if hasAtLeastAdminPermission}
								<DeleteLink {graph} {link} {editLinkForm} />
							{/if}
						</Table.Cell>
					</Table.Row>
				{/each}
			{:else}
				<Table.Row class="hover:bg-transparent">
					<Table.Cell colspan={2} class="text-center">No graphs found.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
