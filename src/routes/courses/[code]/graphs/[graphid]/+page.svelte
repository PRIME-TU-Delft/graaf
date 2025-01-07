<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';
	import Domains from './Domains.svelte';
	import Preview from './Preview.svelte';

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
</script>

<nav class="border-b-2 border-blue-300 bg-blue-200 p-4">
	<a href="/">Home</a>
	<a href="/courses">Courses</a>
	<a href="/courses/{data.course.code}">{data.course.name}</a>
</nav>

<div class="prose mx-auto flex max-w-[80rem] gap-2 p-4 text-blue-900">
	<div class="grow rounded-xl bg-blue-100/50 p-4">
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
			<Tabs.Content value="Subjects">Make subjects</Tabs.Content>
			<Tabs.Content value="Lectures">Wrap subjects in lectures.</Tabs.Content>
			<Tabs.Content value="Preview"><Preview course={data.course} /></Tabs.Content>
		</Tabs.Root>
	</div>

	{#if medium.current}
		<Preview course={data.course} />
	{/if}
</div>
