<script lang="ts">
	import { dev } from '$app/environment';
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { toast } from 'svelte-sonner';

	let { data, children } = $props();

	$effect(() => {
		toast.promise(data.testConnection, {
			loading: 'Loading...',
			duration: Number.POSITIVE_INFINITY,
			error: 'Error, could not connect to the database',
			action: {
				label: 'Retry connection',
				onClick: () => {
					location.reload();
				}
			}
		});
	});

	async function handleToggleAdmin() {
		const res = await fetch('/auth/toggle-admin', {
			method: 'PATCH'
		}).then((res) => res.json());

		if (res.error) toast.error(res.error);
		else location.reload();
	}
</script>

<Toaster closeButton />

<NavigationBar user={data.user} />

<main class="pt-4">
	{@render children()}
</main>

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

				<pre>{JSON.stringify(data.session.user, null, 2)}</pre>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
{/if}
