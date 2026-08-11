<script lang="ts">
	import { page } from '$app/state';

	const statusMessages: Record<number, string> = {
		404: 'Page not found',
		403: "You don't have access to this page",
		500: 'Something went wrong'
	};

	let title = $derived(statusMessages[page.status] ?? 'Something went wrong');
	let message = $derived(page.error?.message || 'Please check the URL and try again.');
</script>

<svelte:head>
	<title>{title} | PRIME Graph Editor</title>
</svelte:head>

<div
	class="flex h-[calc(100dvh)] w-full items-center justify-center rounded-lg bg-purple-200/50 p-2"
>
	<div class="max-w-md space-y-3 text-center">
		<p class="text-sm font-medium text-purple-700">{page.status}</p>
		<h1 class="text-2xl font-semibold text-gray-900">{title}</h1>
		<p class="text-gray-600">{message}</p>
	</div>
</div>
