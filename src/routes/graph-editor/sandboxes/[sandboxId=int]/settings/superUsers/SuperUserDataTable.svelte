<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { cn } from '$lib/utils';
	import { hasCoursePermissions } from '$lib/utils/permissions';
	import type { Course, Program, User } from '@prisma/client';
	import { type ColumnDef, getCoreRowModel } from '@tanstack/table-core';
	import type { PageData } from '../$types';
	import AddSuperUser from './AddSuperUser.svelte';

	type SuperUser = User & { courseRole?: 'Course Admin' | 'Course Editor' } & {
		programRole?: 'Program Admin' | 'Program Editor';
	};

	type DataTableProps = {
		columns: ColumnDef<SuperUser>[];
		course: Course & {
			admins: User[];
			editors: User[];
			programs: (Program & { admins: User[]; editors: User[] })[];
		};
		data: SuperUser[];
	};

	let { data, course, columns }: DataTableProps = $props();

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
						<Table.Head class={cn({ 'text-right': header.column.columnDef.header === 'Role' })}>
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
				<Table.Row
					data-state={row.getIsSelected() && 'selected'}
					class={row.original.id == user.id
						? 'bg-purple-50/50 even:bg-purple-100/50 hover:bg-purple-50'
						: ''}
					fadeDuration={200}
				>
					{#each row.getVisibleCells() as cell (cell.id)}
						<Table.Cell>
							<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
						</Table.Cell>
					{/each}
				</Table.Row>
			{/each}

			<Table.Row>
				{#if table.getRowModel().rows.length == 0}
					{@render addNewUserButton(
						'There are no admins or editors, contact a super admin to add you as a super user.'
					)}
				{:else}
					{@render addNewUserButton()}
				{/if}
			</Table.Row>
		</Table.Body>
	</Table.Root>
</div>

{#snippet addNewUserButton(error?: string)}
	<!-- Is the user is either a programAdmin or superAdmin -->
	{#if hasCoursePermissions(user, course, 'CourseAdminORProgramAdminEditor')}
		<Table.Cell colspan={columns.length}>
			<DialogButton
				button="Add a super user"
				title="Add a super user"
				description="Add a user to the super user list."
				icon="plus"
				bind:open={dialogOpen}
				class="w-full"
			>
				<AddSuperUser
					{course}
					onSuccess={() => {
						dialogOpen = false;
					}}
				/>
			</DialogButton>
		</Table.Cell>
	{:else if error}
		<Table.Cell colspan={columns.length}>
			<p class="text-center">{error}</p>
		</Table.Cell>
	{/if}
{/snippet}
