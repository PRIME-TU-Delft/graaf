<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import Preview from './Preview.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let tabs = ['Domains', 'Subjects', 'Lectures'];

	const currentTab = $derived(page.url.href.split('/').pop()?.toLowerCase());
</script>

<nav class="fixed z-20 w-full border-b-2 border-blue-300 bg-blue-200/80 p-4 backdrop-blur-sm">
	<a href="/">Home</a>
	<a href="/courses">Courses</a>
	<a href="/courses/{data.course.code}">{data.course.name}</a>
</nav>

<div class="layout prose mx-auto grid max-w-[80rem] gap-2 p-4 pt-20 text-blue-900">
	<div>
		<div class="header sticky top-16 z-10 mb-2 flex w-full bg-blue-100 p-1 shadow-md">
			{#each tabs as tab}
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

		<div class="rounded-xl bg-blue-100/50 p-4">
			{@render children()}
		</div>
	</div>

	<div>
		<Preview course={data.course} />
	</div>
</div>

<style lang="postcss">
	.layout {
		grid-template-columns: 1fr 1fr;
	}
</style>
