<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';
	import Domains from './Domains.svelte';
	import Preview from './Preview.svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import Subjects from './Subjects.svelte';
	import Lectures from './Lectures.svelte';
	import { cn } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	const medium = new MediaQuery('min-width: 768px');

	// TAB LOGIC
	const tabs = $derived.by(() => {
		const tabs = ['Domains', 'Subjects', 'Lectures'];
		if (!medium.current) tabs.push('Preview');

		return tabs;
	});

	let tabValue = $state('Domains');

	$effect(() => {
		// Make sure there are never two tabs of preview opened
		if (medium.current && tabValue === 'Preview') tabValue = 'Domains';

		if (data.cycles) {
			const from = data.cycles.from;
			const to = data.cycles.to;
			toast.warning('This graph contains cycles', {
				duration: Number.POSITIVE_INFINITY,
				description: `from ${from.name} to ${to.name}`,
				action: {
					label: 'Go to cycle',
					onClick: () => goto(`#domain-rel-${from.id}-${to.id}`)
				}
			});
		}
	});
</script>

<nav class="border-b-2 border-blue-300 bg-blue-200 p-4">
	<a href="/">Home</a>
	<a href="/courses">Courses</a>
	<a href="/courses/{data.course.code}">{data.course.name}</a>
</nav>

<div class="prose mx-auto flex max-w-[80rem] gap-2 p-4 text-blue-900">
	<div class={cn('w-1/2 rounded-xl bg-blue-100/50 p-4', { 'w-full': !medium.current })}>
		<Tabs.Root bind:value={tabValue}>
			<Tabs.List class="w-full">
				{#each tabs as tab}
					<Tabs.Trigger class="w-full" value={tab}>{tab}</Tabs.Trigger>
				{/each}
			</Tabs.List>
			<Tabs.Content value="Domains">
				{#key data}
					<Domains {...data} />
				{/key}
			</Tabs.Content>
			<Tabs.Content value="Subjects">
				<Subjects {...data} />
			</Tabs.Content>
			<Tabs.Content value="Lectures">
				<Lectures {...data} />
			</Tabs.Content>
			<Tabs.Content value="Preview"><Preview course={data.course} /></Tabs.Content>
		</Tabs.Root>
	</div>

	<div class="w-1/2">
		{#if medium.current}
			<Preview course={data.course} />
		{/if}
	</div>
</div>
