<script lang="ts">
	// Internal dependencies
	import { program } from './stores';

	import { AbstractFormModal } from '$scripts/modals';
	import { Severity, Validation } from '$scripts/validation';

	import type { UserController } from '$scripts/controllers';
	import type { Permission } from '$scripts/types';

	// Components
	import UserRow from './UserRow.svelte';

	import Button from '$components/Button.svelte';
	import Card from '$components/Card.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import FormModal from '$components/FormModal.svelte';
	import Searchbar from '$components/Searchbar.svelte';

	// Assets
	import plus_icon from '$assets/plus-icon.svg';

	// Modals
	class MemberModal extends AbstractFormModal {
		user: UserController | null = null;
		permission: Permission = 'EDITOR';

		constructor() {
			super();
			this.initialize();
		}

		validate(): Validation {
			const validation = new Validation();

			if (this.hasChanged('user')) {
				if (this.user === null) {
					validation.add({
						severity: Severity.error,
						short: 'User is required'
					});
				}
			}

			if (this.hasChanged('permission')) {
				if (this.permission === null) {
					validation.add({
						severity: Severity.error,
						short: 'Permissions are required'
					});
				}
			}

			return validation;
		}

		async submit() {
			if (this.permission === 'EDITOR') {
				$program.assignEditor(this.user as UserController);
			} else {
				$program.assignAdmin(this.user as UserController);
			}

			await $program.save();
			$program = $program; // Trigger reactivity
		}
	}

	// Main
	const member_modal = $state(new MemberModal());
	const permission_options = [
		{
			value: 'EDITOR',
			label: 'Editor',
			validation: Validation.success()
		},
		{
			value: 'ADMIN',
			label: 'Admin',
			validation: Validation.success()
		}
	];

	let query = $state('');

	let filtered_admins = $derived($program.admins.filter((admin) => admin.matchesQuery(query)));
	let filtered_editors = $derived($program.editors.filter((editor) => editor.matchesQuery(query)));
</script>

<!-- Markup -->

<FormModal controller={member_modal}>
	{#snippet header()}
		<h3>New Member</h3>
	{/snippet}
	Assign a user as a member of this program. There are two types of members: editors and admins. Editors
	are by extention editors of all courses assigned to this program. Admins can also assign other members,
	change its name and courses, and archive it.

	{#snippet form()}
		<label for="user"> User </label>
		<Dropdown
			placeholder="Select a user"
			bind:value={member_modal.user}
			options={member_modal.permission === 'EDITOR'
				? $program.editor_options
				: $program.admin_options}
		/>

		<label for="permissions"> Permissions </label>
		<Dropdown
			placeholder="Select their permissions"
			bind:value={member_modal.permission}
			options={permission_options}
		/>
	{/snippet}

	{#snippet submit()}
		Assign
	{/snippet}
</FormModal>

<Card>
	{#snippet header()}
		<h3>Members</h3>

		<div class="flex-spacer"></div>

		<Searchbar placeholder="Search members" bind:value={query} />
		<Button onclick={() => member_modal.show()}>
			<img src={plus_icon} alt="" /> New member
		</Button>
	{/snippet}

	{#if filtered_admins.length + filtered_editors.length === 0}
		<p class="grayed">There's nothing here</p>
	{/if}

	{#each filtered_editors as editor}
		<UserRow user={editor} />
	{/each}

	{#each filtered_admins as admin}
		<UserRow user={admin} />
	{/each}
</Card>
