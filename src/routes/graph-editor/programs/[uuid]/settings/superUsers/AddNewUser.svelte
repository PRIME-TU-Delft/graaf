<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import { editSuperUserSchema } from '$lib/zod/superUserProgramSchema';
	import type { Program, User } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from '../$types';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { displayName } from '$lib/utils/displayUserName';
	import Check from 'lucide-svelte/icons/check';
	import Undo_2 from 'lucide-svelte/icons/undo-2';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';

	type AddNewUserProps = {
		program: Program & { admins: User[]; editors: User[] };
		dialogOpen?: boolean;
	};

	let { program, dialogOpen = $bindable() }: AddNewUserProps = $props();

	let isSuperUserPopoverOpen = $state(false);

	const id = useId();

	const form = superForm((page.data as PageData).editSuperUserForm, {
		id: 'add-program-form-' + id,
		validators: zodClient(editSuperUserSchema),
		onResult: ({ result }) => {
			console.log({ result });
			if (result.type == 'success') {
				toast.success('Successfully add user!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	const nonSuperUser = $derived.by(() => {
		const allUsers = (page.data as PageData).allUsers;

		// filter out all users that are already a super user in this program
		return allUsers.filter(
			(user) =>
				!program.admins.some((u) => u.id == user.id) &&
				!program.editors.some((u) => u.id == user.id)
		);
	});

	let isAdmin = $state(false);

	const userRole = $derived(isAdmin ? 'admin' : 'editor');

	$effect(() => {
		if (program.id) $formData.programId = program.id;
	});
</script>

<form action="?/edit-super-user" method="POST" use:enhance>
	<input type="hidden" name="programId" value={program.id} />

	{@render selectUser()}

	<input type="hidden" name="role" value={userRole} />

	<div class="flex items-center space-x-2 p-2">
		<Checkbox id="is-admin" bind:checked={isAdmin} />
		<Label for="is-admin" class="text-sm font-medium leading-none">
			User is allowed admin permissions
		</Label>
	</div>

	<div class="mt-2 flex items-center justify-between gap-1">
		<Form.FormError class="w-full text-right" {form} />

		<Button
			variant="outline"
			disabled={!$formData.userId || !isAdmin || $submitting}
			onclick={() => {
				isAdmin = false;
				form.reset({
					newState: {
						userId: '',
						role: 'editor'
					}
				});
			}}
		>
			<Undo_2 /> Reset
		</Button>
		<Form.FormButton disabled={$submitting} loading={$delayed}>
			Add super user
			{#snippet loadingMessage()}
				<span>Adding user...</span>
			{/snippet}
		</Form.FormButton>
	</div>
</form>

{#snippet selectUser()}
	<Form.Field {form} name="userId">
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
								nonSuperUser.find((f) => f.id === $formData.userId),
								'Select user'
							)}
							<ChevronsUpDown class="opacity-50" />
						</Popover.Trigger>
						<input hidden value={$formData.userId} name={props.name} />
					</div>
				{/snippet}
			</Form.Control>
			<Popover.Content>
				<Command.Root loop>
					<Command.Input autofocus placeholder="Search users..." class="h-9" />
					<Command.Empty>No user found.</Command.Empty>
					<Command.Group>
						{#each nonSuperUser as user}
							<Command.Item
								value={user.email + ' ' + user.nickname ||
									user.firstName + ' ' + user.lastName ||
									''}
								onSelect={() => {
									$formData.userId = user.id;
									closeAndFocusTrigger(id, () => (isSuperUserPopoverOpen = false));
								}}
							>
								{displayName(user)}
								<Check class={cn('ml-auto', user.id !== $formData.userId && 'text-transparent')} />
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}
