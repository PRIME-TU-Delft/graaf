import { Checkbox } from '$lib/components/ui/checkbox';
import { renderComponent } from '$lib/components/ui/data-table';
import type { Course } from '@prisma/client';
import type { ColumnDef } from '@tanstack/table-core';
import VisitCourse from './VisitCourse.svelte';

export const columns: ColumnDef<Course>[] = [
	{
		id: 'select',
		header: ({ table }) =>
			renderComponent(Checkbox, {
				checked: table.getIsAllPageRowsSelected(),
				indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
				onCheckedChange: (value) => table.toggleAllPageRowsSelected(value),
				'aria-label': 'Select all'
			}),
		cell: ({ row }) =>
			renderComponent(Checkbox, {
				checked: row.getIsSelected(),
				onCheckedChange: (value) => row.toggleSelected(value),
				'aria-label': 'Select row'
			}),
		enableSorting: false,
		enableHiding: false
	},
	{
		accessorKey: 'name',
		header: 'Name'
	},
	{
		accessorKey: 'code',
		header: 'Code'
	},
	{
		id: 'visit',
		cell: ({ row }) =>
			renderComponent(VisitCourse, { href: `/graph-editor/courses/${row.original.code}` })
	}
];
