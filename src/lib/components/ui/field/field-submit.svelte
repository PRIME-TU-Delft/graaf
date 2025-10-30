<script lang="ts">
	import * as Field from '$lib/components/ui/field/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner/index.js';

	import type { Snippet } from 'svelte';

	type Props = {
		pending: number;
		oncancel?: () => void;
		onsubmit?: () => void;
		submitTitle?: string;
		cancelTitle?: string;
		loadingTitle?: string;
		children?: Snippet;
		before?: Snippet;
	};

	const {
		pending,
		oncancel,
		onsubmit,
		submitTitle,
		cancelTitle,
		loadingTitle,
		children,
		before
	}: Props = $props();

	let loading = $state(false);
	let timedOut = $state(false);
	let loadingTimeout = $state<ReturnType<typeof setTimeout>>();
	let timedOutTimeout = $state<ReturnType<typeof setTimeout>>();

	$effect(() => {
		if (pending > 0) {
			loadingTimeout = setTimeout(() => {
				loading = true;
			}, 500);
			timedOutTimeout = setTimeout(() => {
				loading = false;
			}, 8000);
		} else {
			clearTimeout(loadingTimeout);
			loading = false;

			clearTimeout(timedOutTimeout);
			timedOut = false;
		}
	});
</script>

<Field.Field orientation="horizontal" class="justify-end">
	{#if timedOut}
		<p class="text-sm text-red-500">Timed out, try again</p>
	{:else if loading}
		<Spinner class="size-4" />
		<p class="text-sm text-gray-500">{loadingTitle || 'Loading...'}</p>
	{/if}

	{#if before}
		{@render before()}
	{/if}

	<Button type="button" variant="outline" disabled={!!pending} onclick={oncancel}>
		{cancelTitle || 'Cancel'}
	</Button>

	<Button type="submit" disabled={!!pending} onclick={onsubmit}>
		{#if children}
			{@render children()}
		{:else}
			{submitTitle || 'Create domain'}
		{/if}
	</Button>
</Field.Field>
