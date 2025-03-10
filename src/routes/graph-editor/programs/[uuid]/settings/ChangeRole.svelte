<script lang="ts">
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { cn } from '$lib/utils';
	import { hasProgramPermissions } from '$lib/utils/permissions';
	import { editSuperUserSchema } from '$lib/zod/superUserProgramSchema';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	type ChangeRoleProps = {
		userId: string;
		role: 'Admin' | 'Editor';
		name: string;
	};

	let { userId, role, name }: ChangeRoleProps = $props();

	let popupOpen = $state(false);

	const form = superForm((page.data as PageData).editSuperUserForm, {
		id: 'editSuperUserForm' + userId,
		validators: zodClient(editSuperUserSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Role successfully changed!');
				popupOpen = false;
			}
		}
	});
	const { form: formData, enhance, submitting, delayed } = form;

	const { program, user } = page.data as PageData;
	$effect(() => {
		// When program.id or userId changes, update the form data
		$formData.programId = program.id;
		$formData.userId = userId;
	});
</script>

<!-- Only programAdmins and superUsers are allowed to cahnge roles, otherwise just show the role name -->
{#if hasProgramPermissions( user, program, { programAdmin: true, programEditor: false, superAdmin: true } )}
	<Popover.Root bind:open={popupOpen}>
		<Popover.Trigger class={cn([buttonVariants({ variant: 'outline' }), 'float-right'])}>
			{role}
			<ChevronDown />
		</Popover.Trigger>
		<Popover.Content>
			<form action="?/edit-super-user" method="POST" use:enhance>
				<p class="text-lg font-bold">Change role</p>

				<input type="hidden" name="userId" value={userId} />
				<input type="hidden" name="programId" value={program.id} />

				<p>Of user: <span class="font-mono">{name}</span></p>

				<p>
					From: <span class="font-mono">{role}</span>

					<Form.Fieldset {form} name="role" class="flex items-center justify-between">
						<div>
							<Form.Legend>To:</Form.Legend>
							<Form.FieldErrors />
						</div>

						<RadioGroup.Root name="role" bind:value={$formData.role} class="grid py-2">
							{#each ['Admin', 'Editor', 'Revoke'].filter((r) => r != role) as newRole}
								<Form.Control>
									{#snippet children({ props })}
										<div class="flex items-center">
											<RadioGroup.Item class="h-6 w-6" value={newRole.toLowerCase()} {...props} />
											<Form.Label class="w-full cursor-pointer p-2">
												{newRole}
											</Form.Label>
										</div>
									{/snippet}
								</Form.Control>
							{/each}
						</RadioGroup.Root>
					</Form.Fieldset>

					<Form.FormError {form} />
					<Form.FormButton disabled={$submitting} loading={$delayed}>
						Change
						{#snippet loadingMessage()}
							<span>Changing role elements...</span>
						{/snippet}
					</Form.FormButton>
				</p>
			</form>
		</Popover.Content>
	</Popover.Root>
{:else}
	{role}
{/if}
