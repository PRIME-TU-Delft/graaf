<script lang="ts">
	import * as Button from '$lib/components/ui/button/index.js';
	import type { Snippet } from 'svelte';

	type FormButtonProps = {
		loading?: boolean;
		loadingMessage?: string | Snippet;
	} & Button.Props;

	let {
		ref = $bindable(null),
		loading = false,
		loadingMessage,
		...restProps
	}: FormButtonProps = $props();
</script>

<!-- @component
- ref: HTMLButtonElement
- loading: boolean = false
- loadingMessage: Snippet
- ...restProps: Button.Props
 -->

{#if loading}
	<Button.Root bind:ref type="submit" disabled {...restProps}>
		{#if loadingMessage && typeof loadingMessage === 'string'}
			{loadingMessage}
		{:else if loadingMessage && typeof loadingMessage === 'function'}
			{@render loadingMessage?.()}
		{:else}
			Loading...
		{/if}
	</Button.Root>
{:else}
	<Button.Root bind:ref type="submit" {...restProps} />
{/if}
