import type { User } from '@prisma/client';
import type { ColumnDef } from '@tanstack/table-core';

export type ProgramUser = User & { programRole: 'Admin' | 'Editor' };

export const columns: ColumnDef<ProgramUser>[] = [
	{
		accessorKey: 'id',
		header: 'Id'
	},
	{
		accessorKey: 'nickname',
		header: 'Name'
	},
	{
		accessorKey: 'programRole',
		header: 'Role'
	},
	{
		id: 'delete',
		enableHiding: false
		// cell: ({ row }) => renderComponent(DataTableDelete, { id: row.original.id })
	}
];
