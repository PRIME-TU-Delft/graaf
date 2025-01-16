<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { MediaQuery } from 'svelte/reactivity';
	import type { PageData } from './$types';
	import Domains from './Domains.svelte';
	import Lectures from './Lectures.svelte';
	import Preview from './Preview.svelte';
	import Subjects from './Subjects.svelte';
	import { onMount } from 'svelte';

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
	});

	onMount(() => {
		if (data.cycles) {
			const from = data.cycles.from;
			const to = data.cycles.to;
			toast.warning('Graph contains a domain cycle', {
				duration: Number.POSITIVE_INFINITY,
				description: `from ${from.name} to ${to.name}`,
				action: {
					label: 'Go to cycle',
					onClick: () => {
						tabValue = 'Domains';
						goto(`#domain-rel-${from.id}-${to.id}`);
					}
				}
			});
		}
	});
</script>

<nav class="fixed z-20 w-full border-b-2 border-blue-300 bg-blue-200/80 p-4 backdrop-blur-sm">
	<a href="/">Home</a>
	<a href="/courses">Courses</a>
	<a href="/courses/{data.course.code}">{data.course.name}</a>
</nav>

<div class="prose mx-auto flex max-w-[80rem] gap-2 p-4 pt-20 text-blue-900">
	<Tabs.Root class={cn('w-full', { 'mx-auto w-1/2': medium.current })} bind:value={tabValue}>
		<Tabs.List class="sticky top-16 z-10 mb-2 w-full bg-blue-100 py-6 shadow-md">
			{#each tabs as tab}
				<Tabs.Trigger class="w-full" value={tab}>{tab}</Tabs.Trigger>
			{/each}
		</Tabs.List>

		<div class="w-full rounded-xl bg-blue-100/50 p-4">
			<Tabs.Content value="Domains">
				{#key data}
					<Domains {...data} course={data.course} />
				{/key}
			</Tabs.Content>
			<Tabs.Content value="Subjects">
				{#key data}
					<Subjects bind:tabValue {...data} />
				{/key}
			</Tabs.Content>
			<Tabs.Content value="Lectures">
				<Lectures {...data} />
			</Tabs.Content>
			<Tabs.Content value="Preview"><Preview course={data.course} /></Tabs.Content>
		</div>
	</Tabs.Root>

	{#if medium.current}
		<div class="w-1/2">
			<Preview course={data.course} />
		</div>
	{/if}
</div>
