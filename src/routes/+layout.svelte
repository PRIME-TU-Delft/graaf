<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import '../app.css';

	// Components
	import AppSidebar from './AppSidebar.svelte';
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	import type { User } from '@prisma/client';

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
