<script lang="ts" generics="T extends Record<string, unknown>, M = any">
	import * as FormPrimitive from 'formsnap';
	import type { WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { SuperForm } from 'sveltekit-superforms';
	import { fromStore } from 'svelte/store';

	let {
		class: className,
		errorClasses,
		children: childrenProp,
		form,
		...restProps
	}: WithoutChild<FormPrimitive.FieldErrorsProps> & {
		errorClasses?: string | undefined | null;
		form: SuperForm<T, M>;
	} = $props();

	const errors = $derived(fromStore(form.allErrors).current);
</script>

<div class={cn('text-sm font-medium text-destructive', className)} {...restProps}>
	{#each errors as error}
		{#if error.path == '_errors' || error.path == 'non_field_errors'}
			<p class={cn(errorClasses)}>{error.messages.join(' ')}</p>
		{/if}
	{/each}
</div>
