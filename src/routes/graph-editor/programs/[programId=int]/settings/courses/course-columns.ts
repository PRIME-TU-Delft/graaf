import { Checkbox } from '$lib/components/ui/checkbox';
import { renderComponent } from '$lib/components/ui/data-table';
import type { Course } from '@prisma/client';
import type { ColumnDef } from '@tanstack/table-core';
import VisitCourse from './VisitCourse.svelte';

export type UnlinkCandidate = Course & { linkable: boolean; reason?: string };

export const columns: ColumnDef<UnlinkCandidate>[] = [
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
				disabled: !row.original.linkable,
				// onCheckedChange: (value) => row.toggleSelected(value),
				'aria-label': 'Select row'
			}),
		enableSorting: false,
		enableHiding: false
	},
	{
		accessorKey: 'code',
		header: 'Code'
	},
	{
		accessorKey: 'name',
		header: 'Name'
	},
	{
		id: 'visit',
		cell: ({ row }) =>
			renderComponent(VisitCourse, { href: `/graph-editor/courses/${row.original.code}` })
	},
	{
		id: 'reason',
		header: '',
		cell: ({ row }) => row.original.reason ?? ''
	}
];
