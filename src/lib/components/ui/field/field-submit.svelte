<script lang="ts" generics="Input extends RemoteFormInput | void, Output">
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';

	import type { RemoteForm, RemoteFormInput } from '@sveltejs/kit';
	import type { Snippet } from 'svelte';

	type Props = {
		form: RemoteForm<Input, Output>;
		oncancel?: () => void;
		hideCancel?: boolean;
		onsubmit?: () => void;
		submitTitle?: string;
		cancelTitle?: string;
		loadingTitle?: string;
		disabled?: boolean;
		children?: Snippet;
		before?: Snippet;
	};

	const {
		form,
		oncancel,
		hideCancel,
		onsubmit,
		submitTitle,
		cancelTitle,
		loadingTitle,
		disabled,
		children,
		before
	}: Props = $props();

	let loading = $state(false);
	let timedOut = $state(false);
	let loadingTimeout = $state<ReturnType<typeof setTimeout>>();
	let timedOutTimeout = $state<ReturnType<typeof setTimeout>>();

	$effect(() => {
		if (form.pending > 0) {
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

	$effect(() => {
		if (form.fields.issues()) {
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

	{#if !hideCancel}
		<Button type="button" variant="outline" disabled={!!form.pending} onclick={oncancel}>
			{cancelTitle || 'Cancel'}
		</Button>
	{/if}

	<Button type="submit" disabled={!!form.pending || disabled} onclick={onsubmit}>
		{#if children}
			{@render children()}
		{:else}
			{submitTitle || 'Create domain'}
		{/if}
	</Button>
</Field.Field>
