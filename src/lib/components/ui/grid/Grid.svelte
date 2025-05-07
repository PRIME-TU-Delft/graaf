<script module>
	export type GridStateType = {
		columnTemplate: string[];
	};

	class GridState implements GridStateType {
		columnTemplate: string[] = $state([]);
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { onMount, setContext, type Snippet } from 'svelte';

	type Props = {
		class?: string;
		columnTemplate: string[];
		children: Snippet;
	};

	const { class: classes, columnTemplate, children }: Props = $props();

	const gridState = new GridState();

	setContext('grid-template', gridState);

	onMount(() => {
		gridState.columnTemplate = columnTemplate;
	});
</script>

<div
	style="
    grid-template-columns: repeat({columnTemplate.length}, 1fr); 
    grid-template-columns: {columnTemplate.join(' ')};
    "
	class={cn(`my-2 grid w-full overflow-x-auto rounded`, classes)}
>
	{#if columnTemplate}
		{@render children()}
	{/if}
</div>

<div class=""></div>
