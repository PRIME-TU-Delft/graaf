<script lang="ts">
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { editSuperUserSchema } from '$lib/zod/programSchema';
	import { useId } from 'bits-ui';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';

	// Components
	import * as Form from '$lib/components/ui/form/index.js';
	import SelectUsers from '$lib/components/SelectUsers.svelte';
	import { Button } from '$lib/components/ui/button';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';

	// Icons
	import Undo_2 from 'lucide-svelte/icons/undo-2';

	// Types
	import type { Program, User } from '@prisma/client';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';

	type AddNewUserProps = {
		program: Program & {
			admins: User[];
			editors: User[];
		};
		allUsers: User[];
		editSuperUserForm: SuperValidated<Infer<typeof editSuperUserSchema>>;
	};

	let { program, allUsers, editSuperUserForm }: AddNewUserProps = $props();

	const form = superForm(editSuperUserForm, {
		id: 'add-super-user-' + useId(),
		validators: zodClient(editSuperUserSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Successfully added super user!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	const nonSuperUser = $derived(
		allUsers.filter(
			(user) =>
				!program.admins.some((u) => u.id == user.id) &&
				!program.editors.some((u) => u.id == user.id)
		)
	);

	let isAdmin = $state(false);
	let dialogOpen = $state(false);
	const userRole = $derived(isAdmin ? 'admin' : 'editor');

	$effect(() => {
		$formData.programId = program.id;
	});
</script>

<DialogButton
	icon="plus"
	button="Add Super Users"
	title="Add a super user"
	description="Add a user as an admin or editor of this programme."
	class="w-full"
	bind:open={dialogOpen}
>
	<form action="?/edit-super-user" method="POST" use:enhance>
		<input type="hidden" name="programId" value={program.id} />

		<Form.Field {form} name="userId">
			<SelectUsers
				users={nonSuperUser}
				onSelect={(user) => {
					$formData.userId = user.id;
				}}
			/>
		</Form.Field>

		<input type="hidden" name="role" value={userRole} />

		<div class="flex items-center space-x-2 p-2">
			<Checkbox id="is-admin" bind:checked={isAdmin} />
			<Label for="is-admin" class="text-sm leading-none font-medium">
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
					form.reset({ newState: { userId: '', role: 'editor' } });
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
</DialogButton>
