<script lang="ts">
	import { displayName } from '$lib/utils/displayUserName';

	// Components
	import * as Table from '$lib/components/ui/table/index.js';
	import AddSuperUser from './AddSuperUser.svelte';
	import ChangeRole from './ChangeRole.svelte';
	
	// Types
	import type { User, Program } from '@prisma/client';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import type { editSuperUserSchema } from '$lib/zod/programSchema';

	type GraphLinksProps = {
		program: Program & { 
			admins: User[]; 
			editors: User[];
		};
		allUsers: User[];
		canChangeRoles: boolean;
		editSuperUserForm: SuperValidated<Infer<typeof editSuperUserSchema>>
	};

	const { 
		program,
		allUsers,
		canChangeRoles,
		editSuperUserForm
	}: GraphLinksProps = $props();
</script>

<div class="rounded-md border">
	<Table.Root class="!m-0">
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-full">Name</Table.Head>
				<Table.Head>Role</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each program.admins as user (user.id)}
				<Table.Row class="bg-purple-100/50 odd:bg-purple-50/50 hover:bg-purple-100/30">
					<Table.Cell>
						{displayName(user)}
					</Table.Cell>
					<Table.Cell class="flex items-center justify-end gap-1">
						<ChangeRole 
							{user}
							{program}
							{canChangeRoles}
							{editSuperUserForm} 
							role="Admin" 
						/>
					</Table.Cell>
				</Table.Row>
			{/each}

			{#each program.editors as user (user.id)}
				<Table.Row class="bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-100/30">
					<Table.Cell>
						{displayName(user)}
					</Table.Cell>
					<Table.Cell class="flex items-center gap-1">
						<ChangeRole 
							{user}
							{program}
							{canChangeRoles}
							{editSuperUserForm} 
							role="Editor" 
						/>					
					</Table.Cell>
				</Table.Row>
			{/each}

			<Table.Row>
				<Table.Cell colspan={2}>
					<AddSuperUser 
						{program}
						{allUsers}
						{editSuperUserForm}
					/>
				</Table.Cell>
			</Table.Row>
		</Table.Body>
	</Table.Root>
</div>
