<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import Preview from './Preview.svelte';
	import { afterNavigate } from '$app/navigation';
	import { graphD3Store } from '$lib/d3/graphD3.svelte';
	import { Pane, PaneGroup, PaneResizer } from 'paneforge';
	import { GripVertical } from '@lucide/svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let tabs = ['Domains', 'Subjects', 'Lectures'];

	const currentTab = $derived(page.url.pathname.split('/').pop());

	afterNavigate(() => {
		const pathname = currentTab?.toUpperCase();

		if (pathname == 'DOMAINS' || pathname == 'SUBJECTS' || pathname == 'LECTURES') {
			graphD3Store.graphD3?.setView(pathname);
		} else {
			graphD3Store.graphD3?.setView('DOMAINS');
		}
	});
</script>

<div class="prose mx-auto max-w-[80rem]">
	<PaneGroup direction="horizontal" autoSaveId="panels" class="w-full">
		<Pane defaultSize={50} class="h-[calc(100dvh-8rem)] rounded-lg">
			<div
				class="header sticky top-0 z-10 flex w-full gap-1 rounded-lg bg-purple-100 p-1 shadow-md"
			>
				{#each tabs as tab (tab)}
					{@const active = tab.toLowerCase() === currentTab ? 'active' : ''}
					<Button
						class="tab-item {active ? 'bg-white' : ''} w-full no-underline"
						variant="ghost"
						href="./{tab.toLowerCase()}"
					>
						{tab}
					</Button>
				{/each}
			</div>

			<div class="mt-2 h-full overflow-y-auto rounded-lg bg-purple-100/50 p-4">
				{@render children()}
			</div>
		</Pane>
		<PaneResizer class="relative flex w-2 items-center justify-center bg-background">
			<div class="z-10 flex h-7 w-5 items-center justify-center rounded-sm border bg-purple-500">
				<GripVertical />
			</div>
		</PaneResizer>
		<Pane defaultSize={50}>
			<Preview graph={data.graph} />
		</Pane>
	</PaneGroup>
</div>
