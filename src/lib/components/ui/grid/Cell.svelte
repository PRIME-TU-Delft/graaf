<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children: Snippet;
	};

	const { class: classes, children }: Props = $props();
</script>

<div class={cn('flex items-center justify-start px-2', classes)}>
	{@render children()}
</div>
