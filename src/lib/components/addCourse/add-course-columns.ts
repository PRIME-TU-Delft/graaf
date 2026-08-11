import { renderComponent } from '$lib/components/ui/data-table';
import type { Course } from '@prisma/client';
import type { ColumnDef } from '@tanstack/table-core';
import { Checkbox } from '$lib/components/ui/checkbox';

export type LinkCandidate = Course & { linkable: boolean; reason?: string };

export const columns: ColumnDef<LinkCandidate>[] = [
	{
		id: 'select',
		cell: ({ row }) =>
			renderComponent(Checkbox, {
				class: 'border-black',
				checked: row.getIsSelected(),
				disabled: !row.original.linkable,
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
		id: 'reason',
		header: '',
		cell: ({ row }) => row.original.reason ?? ''
	}
];
