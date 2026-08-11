<script lang="ts">
	import { page } from '$app/state';

	const statusMessages: Record<number, string> = {
		404: "This graph isn't available",
		400: 'Invalid graph link',
		500: 'Something went wrong'
	};

	let title = $derived(statusMessages[page.status] ?? 'Something went wrong');
	let message = $derived(page.error?.message || 'This graph could not be loaded.');
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
		<p class="text-sm text-gray-500">Ask your course staff or lecturer for the correct link.</p>
	</div>
</div>
