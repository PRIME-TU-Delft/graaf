<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { graphD3Store } from '$lib/d3/graphD3.svelte';
	import { cn } from '$lib/utils';
	import { Check, ChevronDown, GripVertical } from '@lucide/svelte';
	import { Pane, PaneGroup, PaneResizer } from 'paneforge';
	import GraphRenderer from '$lib/components/GraphRenderer.svelte';

	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { graphState } from '$lib/d3/GraphD3State.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let tabs = ['Domains', 'Subjects', 'Lectures'];

	let hidePreview = $state(page.url.searchParams.get('hidePreview') === 'true');
	const lectureID = $derived(Number(page.url.searchParams.get('lectureID')) || null);
	const currentTab = $derived(page.url.pathname.split('/').pop());
	const searchParams = $derived(
		'?hidePreview=' + String(hidePreview) + (lectureID ? '&lectureID=' + lectureID : '')
	);

	afterNavigate(() => {
		const pathname = currentTab?.toUpperCase();

		if (pathname == 'DOMAINS' || pathname == 'SUBJECTS' || pathname == 'LECTURES') {
			graphD3Store.graphD3?.setView(pathname);
		} else {
			graphD3Store.graphD3?.setView('DOMAINS');
		}
	});
</script>

<div class="mx-auto max-w-[100rem]">
	<PaneGroup direction="horizontal" autoSaveId="panels" class="w-full !overflow-visible">
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
								{#if tab.toLowerCase() === currentTab?.toLowerCase()}
									<DropdownMenu.Item class="justify-between" disabled>
										{tab}
										<Check />
									</DropdownMenu.Item>
								{:else}
									<DropdownMenu.Item
										disabled={graphState.isTransitioning()}
										onclick={() => goto(`./${tab.toLowerCase()}${searchParams}`)}
									>
										{tab}
									</DropdownMenu.Item>
								{/if}
							{/each}
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								onclick={() => {
									hidePreview = !hidePreview;
									goto(page.url.pathname + searchParams);
								}}>{hidePreview ? 'Show' : 'Hide'} Preview</DropdownMenu.Item
							>
							<DropdownMenu.Item disabled>View preview in other tab</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<div class="relative p-4">
					{@render children()}
				</div>
			</div>
		</Pane>

		{#if !hidePreview}
			<PaneResizer class="bg-background relative flex w-2 items-center justify-center">
				<div
					class="absolute z-10 flex h-7 w-5 items-center justify-center rounded-sm border bg-purple-500"
				>
					<GripVertical />
				</div>
			</PaneResizer>

			<Pane defaultSize={50}>
				<div class="sticky top-20 h-[calc(100dvh-8rem)] w-full rounded-xl bg-purple-200/50 p-4">
					<GraphRenderer data={data.graph} editable={true} {lectureID} />
				</div>
			</Pane>
		{/if}
	</PaneGroup>
</div>
