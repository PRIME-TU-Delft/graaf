<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { fade } from 'svelte/transition';

	let {
		ref = $bindable(null),
		class: className,
		fadeDuration = 0,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLTableRowElement>> & { fadeDuration?: number } = $props();
</script>

<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn(
		'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
		className
	)}
	{...restProps}
	transition:fade={{ duration: fadeDuration }}
>
	{@render children?.()}
</tr>
