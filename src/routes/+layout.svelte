<script lang="ts">
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { ModeWatcher } from "mode-watcher";

	import type { User } from '@prisma/client';
	import '../app.css';
	import AppSidebar from './AppSidebar.svelte';

	let { data, children } = $props();

	let sidebarOpen = $state(
		!browser ||
			!localStorage.getItem('sidebarOpen') ||
			localStorage.getItem('sidebarOpen') !== 'false'
	); // default is undefined, that is why we use a double negation
	const sidebarVisible = $derived(
		page.url.pathname?.includes('graph-editor') || page.url.pathname?.includes('users')
	);
</script>

<ModeWatcher />
<Toaster closeButton />

<NavigationBar />

<Sidebar.Provider
	bind:open={sidebarOpen}
	onOpenChange={(open) => {
		if (browser) {
			localStorage.setItem('sidebarOpen', open.toString());
		}
		sidebarOpen = open;
	}}
>
	{#if sidebarVisible}
		<AppSidebar user={data.user as User} />
	{/if}
	<main class="mt-12 w-full p-4">
		{#if sidebarVisible}
			{@const sidebar = Sidebar.useSidebar()}

			{#if sidebar.isMobile}
				<Sidebar.Trigger class="fixed top-4 z-50 bg-purple-100"></Sidebar.Trigger>
			{/if}
		{/if}

		{@render children?.()}
	</main>
</Sidebar.Provider>
