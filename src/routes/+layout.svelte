<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { toast } from 'svelte-sonner';

	import type { User } from '@prisma/client';
	import '../app.css';
	import AppSidebar from './AppSidebar.svelte';

	let { data, children } = $props();

	let sidebarOpen = $state(true);
	const sidebarVisible = $derived(
		page.url.pathname?.includes('graph-editor') || page.url.pathname?.includes('users')
	);
</script>

<Toaster closeButton />

<NavigationBar />

<Sidebar.Provider bind:open={sidebarOpen}>
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
