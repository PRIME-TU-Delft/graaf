import { renderComponent } from '$lib/components/ui/data-table';
import type { Course } from '@prisma/client';
import type { ColumnDef } from '@tanstack/table-core';
import { Checkbox } from '$lib/components/ui/checkbox';

export const columns: ColumnDef<Course>[] = [
	{
		id: 'select',
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
	}
];
