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

/** A user's privilege counts per tier, most senior first, matching the permission hierarchy in
 * src/lib/server/permissions.ts. Used to sort by rank rather than by raw total, so a super admin
 * with no other roles still outranks e.g. a course admin of four courses. */
export function privilegeRank(user: DataUser): number[] {
	return [
		user.role === 'ADMIN' ? 1 : 0,
		user.program_admins.length,
		user.program_editors.length,
		user.course_admins.length,
		user.course_editors.length
	];
}

/** Lexicographic comparison of two privilege ranks: the most senior tier decides unless both
 * users tie on it, in which case the next tier down breaks the tie, and so on. */
export function comparePrivilegeRank(a: number[], b: number[]) {
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return a[i] - b[i];
	}
	return 0;
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
		accessorFn: (user) => privilegeRank(user),
		sortingFn: (rowA, rowB, columnId) =>
			comparePrivilegeRank(rowA.getValue(columnId), rowB.getValue(columnId)),
		header: ({ column }) => renderComponent(SortableHeader, { column, label: 'Privileges' }),
		cell: ({ row }) => {
			return renderComponent(CellRoles, { user: row.original });
		},
		enableGlobalFilter: false
	}
];
