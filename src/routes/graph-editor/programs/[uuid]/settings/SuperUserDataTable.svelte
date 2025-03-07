<script lang="ts" generics="TData, TValue">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { hasProgramPermissions } from '$lib/utils/permissions';
	import type { Program, User } from '@prisma/client';
	import { type ColumnDef, getCoreRowModel } from '@tanstack/table-core';
	import type { PageData } from './$types';
	import AddNewUser from './AddNewUser.svelte';

	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		program: Program & { admins: User[]; editors: User[] };
		data: TData[];
	};

	let { data, program, columns }: DataTableProps<TData, TValue> = $props();

	const user = (page.data as PageData).user as User;

	let dialogOpen = $state(false);

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		getCoreRowModel: getCoreRowModel()
	});
</script>

<div class="rounded-md border">
	<Table.Root class="m-0">
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
				<Table.Row data-state={row.getIsSelected() && 'selected'}>
					{#each row.getVisibleCells() as cell (cell.id)}
						<Table.Cell>
							<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
						</Table.Cell>
					{/each}

					{@render addNewUserButton('You do not have permission to add a super user.')}
				</Table.Row>
			{:else}
				<Table.Row>
					{@render addNewUserButton(
						'There are no super users, contact a super admin to add you as a super user.'
					)}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

{#snippet addNewUserButton(error: string)}
	<!-- Is the user is either a programAdmin or superAdmin -->
	{#if hasProgramPermissions( user, program, { programAdmin: true, programEditor: false, superAdmin: true } )}
		<Table.Cell colspan={columns.length}>
			<DialogButton
				button="Add a super user"
				title="Add a super user"
				description="Add a user to the super user list."
				icon="plus"
				bind:open={dialogOpen}
				class="w-full"
			>
				<AddNewUser {program} />
			</DialogButton>
		</Table.Cell>
	{:else}
		<Table.Cell colspan={columns.length}>
			<p class="text-center">{error}</p>
		</Table.Cell>
	{/if}
{/snippet}
