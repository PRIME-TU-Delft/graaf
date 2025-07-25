import { Checkbox } from '$lib/components/ui/checkbox';
import { renderComponent } from '$lib/components/ui/data-table';
import type { Program, User } from '@prisma/client';
import type { ColumnDef } from '@tanstack/table-core';
import CellName from './CellName.svelte';
import CellRoles from './CellRoles.svelte';

export type DataUser = User & {
	program_editors: Program[];
	program_admins: Program[];
	course_editors: Program[];
	course_admins: Program[];
};

export const columns: ColumnDef<DataUser>[] = [
	{
		id: 'select',
		cell: ({ row }) =>
			renderComponent(Checkbox, {
				class: 'border-black',
				checked: row.getIsSelected(),
				// onCheckedChange: (value) => row.toggleSelected(value),
				'aria-label': 'Select row'
			}),
		enableSorting: false,
		enableHiding: false
	},
	{
		accessorKey: 'name',
		header: 'Name',
		cell: ({ row }) => {
			return renderComponent(CellName, { row: row.original });
		}
	},
	{
		accessorKey: 'email',
		header: 'Email'
	},
	{
		accessorKey: 'roles',
		header: 'Roles',
		cell: ({ row }) => {
			return renderComponent(CellRoles, { user: row.original });
		}
	}
];
