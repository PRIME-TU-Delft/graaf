<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, type ButtonSize, type ButtonVariant } from '$lib/components/ui/button/index.js';
	import type { Snippet } from 'svelte';

	const {
		user,
		size = 'lg',
		variant,
		class: className = '',
		formClass = '',
		signedIn,
		signedOut
	}: {
		user?: unknown;
		size?: ButtonSize;
		variant?: ButtonVariant;
		class?: string;
		formClass?: string;
		signedIn?: Snippet;
		signedOut: Snippet;
	} = $props();
</script>

{#if user && signedIn}
	<Button {size} {variant} href={resolve('/graph-editor')} class={className}>
		{@render signedIn()}
	</Button>
{:else}
	<form action="?/auth" method="POST" class={formClass}>
		<input type="hidden" name="providerId" value="surfconext" />
		<Button type="submit" {size} {variant} class={className}>
			{@render signedOut()}
		</Button>
	</form>
{/if}
