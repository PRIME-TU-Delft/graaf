<script lang="ts" generics="T extends Record<string, unknown>, M = any">
	import * as FormPrimitive from 'formsnap';
	import type { WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { SuperForm } from 'sveltekit-superforms';
	import { fromStore } from 'svelte/store';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		errorClasses,
		children,
		form,
		...restProps
	}: {
		class?: string;
		errorClasses?: string | undefined | null;
		form: SuperForm<T, M>;
		children?: Snippet;
	} = $props();

	const errors = $derived(fromStore(form.allErrors).current);
</script>

<div class={cn('text-sm font-medium text-destructive', className)} {...restProps}>
	{#each errors as error}
		{#if error.path == '_errors' || error.path == ''}
			{#if children}
				{@render children()}
			{:else}
				<p class={cn(errorClasses)}>{error.messages.join(' ')}</p>
			{/if}
		{/if}
	{/each}
</div>
