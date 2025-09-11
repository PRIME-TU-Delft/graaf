<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils';
	import { Check, ChevronDown, GripVertical } from '@lucide/svelte';
	import { Pane, PaneGroup, PaneResizer } from 'paneforge';
	import GraphRenderer from '$lib/components/GraphRenderer.svelte';
	import { graphState } from '$lib/d3/GraphD3State.svelte';

	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let tabs = ['DOMAINS', 'SUBJECTS', 'LECTURES'] as ('DOMAINS' | 'SUBJECTS' | 'LECTURES')[];

	const hidePreview = $derived(page.url.searchParams.get('hidePreview') === 'true');
	const lectureID = $derived(Number(page.url.searchParams.get('lectureID')) || null);
	const view = $derived.by(() => {
		const param = page.url.searchParams.get('view')?.toUpperCase();
		if (param && ['DOMAINS', 'SUBJECTS', 'LECTURES'].includes(param))
			return param as 'DOMAINS' | 'SUBJECTS' | 'LECTURES';
		return 'DOMAINS';
	});

	function gotoView(view: 'DOMAINS' | 'SUBJECTS' | 'LECTURES') {
		const params = new URLSearchParams();
		for (const [key, value] of page.url.searchParams.entries())
			params.set(key, value);
		params.set('view', view);
	
		goto(`./${view.toLowerCase()}?${params.toString()}`);
	}

	function togglePreview() {
		const params = new URLSearchParams();
		for (const [key, value] of page.url.searchParams.entries())
			params.set(key, value);
		params.set('hidePreview', hidePreview ? 'false' : 'true');

		goto(`?${params.toString()}`);
	}

	function capitalize(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}

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
								{#if tab.toLowerCase() === view?.toLowerCase()}
									<DropdownMenu.Item class="justify-between" disabled>
										{capitalize(tab)}
										<Check />
									</DropdownMenu.Item>
								{:else}
									<DropdownMenu.Item
										disabled={graphState.isTransitioning()}
										onclick={() => gotoView(tab)}
									>
										{capitalize(tab)}
									</DropdownMenu.Item>
								{/if}
							{/each}
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								onclick={() => togglePreview() }
							>
								{hidePreview ? 'Show' : 'Hide'} Preview
							</DropdownMenu.Item
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
					<GraphRenderer data={data.graph} editable={true} {view} {lectureID} />
				</div>
			</Pane>
		{/if}
	</PaneGroup>
</div>
