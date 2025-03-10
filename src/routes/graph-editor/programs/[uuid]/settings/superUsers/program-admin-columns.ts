import { renderComponent } from '$lib/components/ui/data-table';
import type { User } from '@prisma/client';
import type { ColumnDef } from '@tanstack/table-core';
import ChangeRole from './ChangeRole.svelte';
import { displayName } from '$lib/utils/displayUserName';

export type ProgramUser = User & { programRole: 'Admin' | 'Editor' };

export const columns: ColumnDef<ProgramUser>[] = [
	{
		accessorKey: 'nickname',
		header: 'Name'
	},
	{
		accessorKey: 'programRole',
		header: 'Role',
		cell: ({ row }) =>
			renderComponent(ChangeRole, {
				userId: row.original.id,
				role: row.original.programRole,
				name: displayName(row.original)
			})
	}
];
