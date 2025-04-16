<script lang="ts">
	import { dev } from '$app/environment';
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { toast } from 'svelte-sonner';

	import '../app.css';
	import AppSidebar from './AppSidebar.svelte';
	import { page } from '$app/state';

	let { data, children } = $props();

	let sidebarOpen = $state(false);

	async function handleToggleAdmin() {
		const res = await fetch('/auth/toggle-admin', {
			method: 'PATCH'
		}).then((res) => res.json());

		if (res.error) toast.error(res.error);
		else location.reload();
	}
</script>

<Toaster closeButton />

<NavigationBar user={data.user} {sidebarOpen} />

<Sidebar.Provider bind:open={sidebarOpen}>
	{#if page.url.pathname?.includes('graph-editor')}
		<AppSidebar user={data.user} />
	{/if}
	<main class="mt-12 w-full p-4">
		{#if page.url.pathname?.includes('graph-editor')}
			<Sidebar.Trigger class="fixed top-4 z-50 bg-purple-100"></Sidebar.Trigger>
		{/if}
		{@render children?.()}
	</main>
</Sidebar.Provider>

{#if dev}
	<!-- When in Dev mode, allow the user to toggle between ADMIN/USER role  -->
	<Accordion.Root
		type="single"
		class="fixed bottom-4 right-4 z-50 rounded-lg bg-blue-900/20 p-2 opacity-5 transition-opacity hover:opacity-100"
	>
		<Accordion.Item value="item-1" class="border-b-0">
			<Accordion.Trigger class="p-0">Toggle Admin</Accordion.Trigger>
			<Accordion.Content class="z-50">
				<Button class="m-0" onclick={handleToggleAdmin}>Toggle admin</Button>

				<pre>{JSON.stringify(data.user, null, 2)}</pre>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
{/if}
