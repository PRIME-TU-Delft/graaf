<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { matchesUserSearch } from './userSearch';
	import {
		type ColumnDef,
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		type PaginationState,
		type SortingState
	} from '@tanstack/table-core';

	// Components
	import { Button } from '$lib/components/ui/button';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table/index.js';

	// Icons
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';

	// Types
	import type { PageData } from '../$types';
	import type { DataUser } from './userTableColumns';

	type DataTableProps = {
		columns: ColumnDef<DataUser>[];
		data: DataUser[];
	};

	let { data, columns }: DataTableProps = $props();

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([]);
	let globalFilter = $state('');

	const table = createSvelteTable({
		get data() {
			return data;
		},
		get columns() {
			return columns;
		},
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get globalFilter() {
				return globalFilter;
			}
		},
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onGlobalFilterChange: (updater) => {
			if (typeof updater === 'function') {
				globalFilter = updater(globalFilter);
			} else {
				globalFilter = updater;
			}

			// A narrower result set can leave the current page out of range
			pagination = { ...pagination, pageIndex: 0 };
		},
		globalFilterFn: (row, _columnId, filterValue) => matchesUserSearch(row.original, filterValue),
		// Without this, table-core falls back to the row index as the row id, so the keyed each
		// block below keys by position. Re-sorting the list then rebinds open UI, like the
		// privileges dialog, onto whichever user landed on that row.
		getRowId: (user) => user.id,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	});

	const matchCount = $derived(table.getFilteredRowModel().rows.length);
</script>

<div class="mt-4 flex flex-wrap items-center justify-between gap-2">
	<div class="relative w-full max-w-sm">
		<Search class="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-purple-400" />
		<Input
			type="search"
			placeholder="Search by name or email..."
			aria-label="Search users by name or email"
			class="pl-8"
			bind:value={globalFilter}
		/>
		{#if globalFilter}
			<Button
				variant="ghost"
				size="icon"
				class="absolute top-1/2 right-1 size-7 -translate-y-1/2"
				aria-label="Clear search"
				onclick={() => (globalFilter = '')}
			>
				<X />
			</Button>
		{/if}
	</div>

	<p class="m-0 text-sm text-purple-600">
		{matchCount}
		{matchCount === 1 ? 'user' : 'users'}
		{#if globalFilter}of {data.length}{/if}
	</p>
</div>

<div class="rounded-md border">
	<Table.Root class="mt-2!">
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row>
					{#each headerGroup.headers as header (header.id)}
						<Table.Head colspan={header.colSpan}>
							{#if !header.isPlaceholder}
								<FlexRender
									content={header.column.columnDef.header}
									context={header.getContext()}
								/>
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row
					class={cn((page.data as PageData).user.id == row.original.id && 'bg-primary/10')}
				>
					{#each row.getVisibleCells() as cell (cell.id)}
						<Table.Cell>
							<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
	<div class="flex items-center justify-end space-x-2 py-4">
		<Button
			variant="outline"
			size="sm"
			onclick={() => table.previousPage()}
			disabled={!table.getCanPreviousPage()}
		>
			Previous
		</Button>
		<Button
			variant="outline"
			size="sm"
			onclick={() => table.nextPage()}
			disabled={!table.getCanNextPage()}
		>
			Next
		</Button>

		<p class="mr-2 text-sm">{pagination.pageIndex + 1} / {table.getPageCount() || 1}</p>
	</div>
</div>
