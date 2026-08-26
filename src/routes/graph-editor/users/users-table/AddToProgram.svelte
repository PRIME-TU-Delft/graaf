<script lang="ts">
	import { page } from '$app/state';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import { editSuperUserSchema } from '$lib/zod/programSchema';
	import { useId } from 'bits-ui';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	// Components
	import { buttonVariants } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover/index.js';

	// Icons
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';

	// Types
	import type { PageData } from '../$types';
	import type { DataUser } from './userTableColumns';

	type Props = {
		user: DataUser;
	};

	const { user }: Props = $props();

	const triggerId = useId();
	const checkboxId = useId();

	const data = $derived(page.data as PageData);

	const availablePrograms = $derived(
		data.allPrograms.filter(
			(program) =>
				!user.program_admins.some((p) => p.id === program.id) &&
				!user.program_editors.some((p) => p.id === program.id)
		)
	);

	let selectedProgramId = $state<number | null>(null);
	let asAdmin = $state(false);
	let popoverOpen = $state(false);

	const selectedProgram = $derived(availablePrograms.find((p) => p.id === selectedProgramId));

	const form = superForm((page.data as PageData).editSuperUserForm, {
		id: 'add-to-program-' + useId(),
		validators: zodClient(editSuperUserSchema),
		// These fields are filled from the row, never typed in, so resetting the store after a
		// successful submit would just empty it and make the next submit fail client-side
		// validation without ever reaching the server
		resetForm: false,
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('User added to program');
				selectedProgramId = null;
				asAdmin = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	// Keep the store in sync with the hidden inputs, otherwise client-side validation rejects
	// the submit before it leaves the page
	$effect(() => {
		$formData.userId = user.id;
		$formData.role = asAdmin ? 'admin' : 'editor';
		if (selectedProgramId) $formData.programId = selectedProgramId;
	});
</script>

{#if availablePrograms.length == 0}
	<p class="m-0 mt-3 text-xs text-purple-500">This user already belongs to every program.</p>
{:else}
	<form
		action="?/edit-super-user"
		method="POST"
		class="mt-3 border-t border-purple-200 pt-3"
		use:enhance
	>
		<input type="hidden" name="userId" value={user.id} />
		<input type="hidden" name="programId" value={selectedProgramId ?? ''} />
		<input type="hidden" name="role" value={asAdmin ? 'admin' : 'editor'} />

		<p class="m-0 text-sm font-medium">Add to a program</p>

		<div class="mt-2 flex flex-wrap items-center gap-2">
			<Popover.Root bind:open={popoverOpen}>
				<Popover.Trigger
					id={triggerId}
					role="combobox"
					class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-w-56 justify-between')}
				>
					{selectedProgram?.name ?? 'Select a program'}
					<ChevronsUpDown class="opacity-50" />
				</Popover.Trigger>
				<Popover.Content class="p-0">
					<Command.Root loop>
						<Command.Input autofocus placeholder="Search programs..." class="my-1 h-9" />
						<Command.List>
							<Command.Empty>No program found.</Command.Empty>
							<Command.Group>
								{#each availablePrograms as program (program.id)}
									<Command.Item
										value={program.name}
										onSelect={() => {
											selectedProgramId = program.id;
											closeAndFocusTrigger(triggerId, () => (popoverOpen = false));
										}}
										class="flex items-center justify-between"
									>
										{program.name}
										<Check
											class={cn(
												'ml-auto w-auto',
												program.id !== selectedProgramId && 'w-0 text-transparent'
											)}
										/>
									</Command.Item>
								{/each}
							</Command.Group>
						</Command.List>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>

			<div class="flex items-center gap-2">
				<Checkbox id={checkboxId} bind:checked={asAdmin} />
				<Label for={checkboxId} class="text-sm leading-none font-medium">As program admin</Label>
			</div>

			<Form.FormButton size="sm" disabled={!selectedProgramId || $submitting} loading={$delayed}>
				Add to program
				{#snippet loadingMessage()}
					<span>Adding...</span>
				{/snippet}
			</Form.FormButton>
		</div>

		<Form.FormError class="mt-2" {form} />
	</form>
{/if}
