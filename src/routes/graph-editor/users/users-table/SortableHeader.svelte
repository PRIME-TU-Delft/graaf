<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	// Icons
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';

	// Types
	import type { Column } from '@tanstack/table-core';
	import type { DataUser } from './userTableColumns';

	type Props = {
		column: Column<DataUser, unknown>;
		label: string;
	};

	const { column, label }: Props = $props();

	const sorted = $derived(column.getIsSorted());
</script>

<Button
	variant="ghost"
	size="sm"
	class="-ml-3"
	aria-label="Sort by {label}"
	onclick={() => column.toggleSorting(sorted === 'asc')}
>
	{label}
	{#if sorted === 'asc'}
		<ArrowUp />
	{:else if sorted === 'desc'}
		<ArrowDown />
	{:else}
		<ChevronsUpDown class="opacity-50" />
	{/if}
</Button>
