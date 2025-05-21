<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import { displayName } from '$lib/utils/displayUserName';
	import type { User } from '@prisma/client';
	import { useId } from 'bits-ui';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';

	type AddNewUserProps = {
		value?: string;
		users: User[];
		userRoles?: Map<string, string>;
		onSelect?: (user: User) => void;
	};

	let {
		value = $bindable(),
		users,
		userRoles = new Map(),
		onSelect = () => {}
	}: AddNewUserProps = $props();
	const id = useId();

	let isSuperUserPopoverOpen = $state(false);
</script>

<Popover.Root bind:open={isSuperUserPopoverOpen}>
	<Form.Control {id}>
		{#snippet children({ props })}
			<div class="mt-2 flex w-full items-center justify-between">
				<Form.Label>Select a user</Form.Label>
				<Popover.Trigger
					class={cn(buttonVariants({ variant: 'outline' }), 'min-w-[50%] justify-between')}
					role="combobox"
					{...props}
				>
					{displayName(
						users.find((f) => f.id === value),
						'Select user'
					)}
					<ChevronsUpDown class="opacity-50" />
				</Popover.Trigger>
				<input hidden {value} name={props.name} />
			</div>
		{/snippet}
	</Form.Control>
	<Popover.Content>
		<Command.Root loop>
			<Command.Input autofocus placeholder="Search users..." class="my-1 h-9" />
			<Command.Empty>No user found.</Command.Empty>
			<Command.Group>
				{#each users as user (user.id)}
					<Command.Item
						value={user.email + ' ' + user.nickname || user.firstName + ' ' + user.lastName || ''}
						onSelect={() => {
							closeAndFocusTrigger(id, () => (isSuperUserPopoverOpen = false));
							value = user.id;
							onSelect(user);
						}}
						class="flex items-center justify-between"
					>
						{displayName(user)}

						<div class="flex items-center gap-1">
							{#if userRoles.has(user.id)}
								<p class="ml-auto text-xs">Program {userRoles.get(user.id)}</p>
							{/if}
							<Check class={cn('ml-auto w-auto', user.id !== value && 'w-0 text-transparent')} />
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
<Form.FieldErrors />
