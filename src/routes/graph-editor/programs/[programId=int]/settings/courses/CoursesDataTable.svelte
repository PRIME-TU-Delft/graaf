<script lang="ts">
	import { page } from '$app/state';
	import {
		getCoreRowModel,
		getPaginationRowModel,
		type ColumnDef,
		type PaginationState,
		type RowSelectionState,
		type VisibilityState
	} from '@tanstack/table-core';

	import AddCourse from '$lib/components/addCourse/AddCourse.svelte';
	import { Button } from '$lib/components/ui/button';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	import UnlinkCourses from './UnlinkCourses.svelte';

	import { hasProgramPermissions } from '$lib/utils/permissions';
	import type { Course, Program, User } from '@prisma/client';
	import type { PageData } from '../$types';

	type DataTableProps = {
		columns: ColumnDef<Course, Course>[];
		program: Program & { courses: Course[]; admins: User[]; editors: User[] };
		data: Course[];
		courses: Promise<Course[]>;
	};

	let { data, program, columns, courses }: DataTableProps = $props();

	const { user, linkCoursesForm, createNewCourseForm } = page.data as PageData;

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let rowSelection = $state<RowSelectionState>({});

	const isAdmin = $derived(hasProgramPermissions(user, program, 'ProgramAdmin'));

	// Hide the "select" column if the user is not an admin, otherwise show all columns
	const columnVisibility = $derived<VisibilityState>(isAdmin ? {} : { select: false });

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		state: {
			get pagination() {
				return pagination;
			},
			get rowSelection() {
				return rowSelection;
			},
			get columnVisibility() {
				return columnVisibility;
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
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	});
</script>

<div class="mt-2 flex items-center justify-between">
	<h2 class="my-2">Courses</h2>

	{#if Object.entries(rowSelection).filter(([, selected]) => selected == true).length > 0}
		<UnlinkCourses bind:rowSelection {program} />
	{/if}
</div>

<p class="my-1">
	These are all the courses that are linked to this program. Click on the checkboxes to select a
	course you would like to unlink.
</p>

<div class="rounded-md border">
	<Table.Root class="!m-0">
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
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row
					data-state={row.getIsSelected() && 'selected'}
					onclick={() => {
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
		</Table.Body>
	</Table.Root>

	<div class="flex items-center justify-end space-x-2 border-t px-4 py-2">
		{#key table.getRowModel().rows}
			<AddCourse {program} {user} {courses} {linkCoursesForm} {createNewCourseForm} />
		{/key}

		{#if table.getPageCount() > 1}
			<Button
				variant="outline"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				Previous
			</Button>

			<Button variant="outline" onclick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
				Next
			</Button>

			<p class="text-sm">{pagination.pageIndex + 1} / {table.getPageCount()}</p>
		{/if}
	</div>
</div>
