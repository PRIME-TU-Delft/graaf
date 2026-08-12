import { renderComponent } from '$lib/components/ui/data-table';
import { displayName } from '$lib/utils/displayUserName';
import type { Course, Program, User } from '@prisma/client';
import type { ColumnDef } from '@tanstack/table-core';
import CellName from './CellName.svelte';
import CellRoles from './CellRoles.svelte';
import SortableHeader from './SortableHeader.svelte';

export type DataUser = User & {
	program_editors: Program[];
	program_admins: Program[];
	course_editors: Course[];
	course_admins: Course[];
};

/** Every special privilege a user holds, counting the super-admin role as one on top of each
 * program and course role. */
export function privilegeCount(user: DataUser) {
	return (
		(user.role === 'ADMIN' ? 1 : 0) +
		user.program_admins.length +
		user.program_editors.length +
		user.course_admins.length +
		user.course_editors.length
	);
}

export const columns: ColumnDef<DataUser>[] = [
	{
		// User has no single name column, so sort and filter on whatever is displayed
		id: 'name',
		accessorFn: (user) => displayName(user),
		header: ({ column }) => renderComponent(SortableHeader, { column, label: 'Name' }),
		cell: ({ row }) => {
			return renderComponent(CellName, { row: row.original });
		}
	},
	{
		accessorKey: 'email',
		header: ({ column }) => renderComponent(SortableHeader, { column, label: 'Email' })
	},
	{
		id: 'privileges',
		accessorFn: (user) => privilegeCount(user),
		header: ({ column }) => renderComponent(SortableHeader, { column, label: 'Privileges' }),
		cell: ({ row }) => {
			return renderComponent(CellRoles, { user: row.original });
		},
		enableGlobalFilter: false
	}
];
