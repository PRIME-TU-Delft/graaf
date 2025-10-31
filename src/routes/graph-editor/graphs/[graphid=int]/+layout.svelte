<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import GraphRenderer from '$lib/components/GraphRenderer.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { graphView } from '$lib/d3/GraphD3View.svelte';
	import { cn } from '$lib/utils';
	import { ChevronDown, GripVertical } from '@lucide/svelte';
	import { Pane, PaneGroup, PaneResizer } from 'paneforge';
	import type { Snippet } from 'svelte';
	import { getGraph } from '../graph.remote';

	let { children }: { children: Snippet } = $props();
	const graphId = Number(page.params.graphid);

	let tabs = ['DOMAINS', 'SUBJECTS', 'LECTURES'] as const;

	const currentTab = $derived.by(() => {
		const tab = page.url.pathname.split('/').at(-1)?.toUpperCase();
		if (tab && (tabs as readonly string[]).includes(tab))
			return tab as 'DOMAINS' | 'SUBJECTS' | 'LECTURES';

		return 'DOMAINS';
	});

	$effect(() => {
		graphView.changeView(currentTab);
	});

	const hidePreview = $derived(page.url.searchParams.get('hidePreview') === 'true');
	const lectureID = $derived(Number(page.url.searchParams.get('lectureID')) || null);

	function capitalize(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}
</script>

<div class="mx-auto max-w-400">
	<PaneGroup direction="horizontal" autoSaveId="panels" class="w-full overflow-visible!">
		<Pane defaultSize={50} class="h-[calc(100dvh-8rem)] rounded-lg">
			<div class="h-full scroll-p-16 overflow-y-auto scroll-smooth rounded-lg bg-purple-100/50">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={cn(
							buttonVariants({ variant: 'default', size: 'lg' }),
							'sticky top-0 z-20 rounded-se-none rounded-ee-2xl rounded-es-none'
						)}
					>
						Change view
						<ChevronDown />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Group>
							<DropdownMenu.GroupHeading>Change view</DropdownMenu.GroupHeading>
							{#each tabs as tab (tab)}
								<DropdownMenu.Item
									disabled={tab == currentTab}
									onclick={() => {
										goto(`./${tab.toLowerCase() + (hidePreview ? '?hidePreview=true' : '')}`);
									}}
									class={cn({ 'bg-gray-100 font-bold': tab == currentTab })}
								>
									{capitalize(tab)}
								</DropdownMenu.Item>
							{/each}
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								onclick={() => {
									goto(`./${currentTab.toLowerCase() + '?hidePreview=' + !hidePreview}`);
								}}
							>
								{hidePreview ? 'Show' : 'Hide'} Preview
							</DropdownMenu.Item>
							<DropdownMenu.Item disabled>View preview in other tab</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<div class="relative p-4">
					<svelte:boundary>{@render children()}</svelte:boundary>
				</div>
			</div>
		</Pane>

		{#if !hidePreview}
			<PaneResizer class="bg-background relative flex w-2 items-center justify-center">
				<div
					class="absolute z-10 flex h-7 w-5 items-center justify-center rounded-sm bg-purple-700 text-white"
				>
					<GripVertical />
				</div>
			</PaneResizer>

			<Pane defaultSize={50}>
				<div class="sticky top-20 h-[calc(100dvh-8rem)] w-full rounded-xl bg-purple-200/50 p-4">
					<svelte:boundary>
						{#await getGraph(graphId) then graph}
							<GraphRenderer data={graph.graph} editable={true} view={currentTab} {lectureID} />
						{:catch error}
							<div class="flex h-full items-center justify-center">
								<p class="text-center text-sm text-red-500">Error loading graph: {error.message}</p>
							</div>
						{/await}
					</svelte:boundary>
				</div>
			</Pane>
		{/if}
	</PaneGroup>
</div>
