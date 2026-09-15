<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { linkingCoursesSchema } from '$lib/zod/programSchema';
	import type { Course, Program, User } from '@prisma/client';
	import type { LinkCandidate } from './add-course-columns';
	import {
		type ColumnDef,
		getCoreRowModel,
		getPaginationRowModel,
		type PaginationState,
		type RowSelectionState
	} from '@tanstack/table-core';
	import { fade } from 'svelte/transition';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import LinkCourses from './LinkCourses.svelte';
	import Undo_2 from '@lucide/svelte/icons/undo-2';

	type DataTableProps = {
		linkCoursesForm: SuperValidated<Infer<typeof linkingCoursesSchema>>;
		columns: ColumnDef<LinkCandidate, LinkCandidate>[];
		program: Program & { courses: Course[]; admins: User[]; editors: User[] };
		data: LinkCandidate[];
		loading: boolean;
		dialogOpen: boolean;
	};

	let {
		linkCoursesForm,
		data,
		program,
		columns,
		loading,
		// eslint-disable-next-line no-useless-assignment -- write-only, closes the dialog via bind:dialogOpen in the parent
		dialogOpen = $bindable()
	}: DataTableProps = $props();

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 4 });
	let rowSelection = $state<RowSelectionState>({});
	let search = $state('');

	const filteredData = $derived(
		search.trim() === ''
			? data
			: data.filter((c) => {
					const q = search.trim().toLowerCase();
					return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
				})
	);

	$effect(() => {
		void search;
		pagination = { pageIndex: 0, pageSize: 4 };
		rowSelection = {};
	});

	const table = createSvelteTable({
		get data() {
			return filteredData;
		},
		get columns() {
			return columns;
		},
		state: {
			get pagination() {
				return pagination;
			},
			get rowSelection() {
				return rowSelection;
			}
		},
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		onRowSelectionChange: (updater) => {
			if (typeof updater === 'function') {
				rowSelection = updater(rowSelection);
			} else {
				rowSelection = updater;
			}
		},
		enableRowSelection: (row) => row.original.linkable,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	});
</script>

<Input placeholder="Search by name or code..." bind:value={search} class="mb-2" />

<div class="rounded-md border">
	<Table.Root class="m-0">
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row>
					{#each headerGroup.headers as header (header.id)}
						<Table.Head>
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
			{#if loading}
				<Table.Row>
					<Table.Cell colspan={columns.length}>
						<p>Loading courses...</p>
					</Table.Cell>
				</Table.Row>
			{:else}
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row
						data-state={row.getIsSelected() && 'selected'}
						class={!row.original.linkable ? 'opacity-50' : ''}
						onclick={() => {
							if (!row.original.linkable) return;
							const isSelected = rowSelection[row.id];
							rowSelection = {
								...rowSelection,
								[row.id]: !isSelected
							};
						}}
					>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			{/if}
		</Table.Body>
	</Table.Root>

	{#if !loading}
		<div class="flex items-center justify-between space-x-2 border-t px-4 py-2" in:fade>
			<div class="flex items-center justify-end gap-2">
				{#if table.getPageCount() > 1}
					<Button
						variant="outline"
						onclick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Previous
					</Button>

					<Button
						variant="outline"
						onclick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Next
					</Button>

					<p class="text-sm">{pagination.pageIndex + 1} / {table.getPageCount()}</p>
				{/if}
			</div>

			<div class="ml-auto flex gap-1">
				<Button
					variant="outline"
					disabled={Object.keys(rowSelection).length == 0}
					onclick={() => {
						rowSelection = {};
					}}
				>
					<Undo_2 /> Reset
				</Button>
				<LinkCourses
					onSuccess={() => (dialogOpen = false)}
					courses={filteredData}
					{program}
					bind:rowSelection
					{linkCoursesForm}
				/>
			</div>
		</div>
	{/if}
</div>
