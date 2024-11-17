
<script lang="ts">

	// Internal dependencies
	import { program } from './stores'

	import { Validation, Severity } from '$scripts/validation'
	import { FormModal } from '$scripts/modals'

    import type { Permission } from '$scripts/types'
	import type { UserController } from '$scripts/controllers'

	// Components
	import UserRow from './UserRow.svelte'

	import Searchbar from '$components/Searchbar.svelte'
	import Feedback from '$components/Feedback.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'
	import Card from '$components/Card.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'

    // Modals
    class MemberModal extends FormModal {
        user: UserController | null = null
        permission: Permission = 'EDITOR'

        constructor() {
            super()
            this.initialize()
        }

        validate(): Validation {
            const validation = new Validation()

            if (this.hasChanged('user')) {
                if (this.user === null) {
                    validation.add({
                        severity: Severity.error,
                        short: 'User is required'
                    })
                }
            }

            if (this.hasChanged('permission')) {
                if (this.permission === null) {
                    validation.add({
                        severity: Severity.error,
                        short: 'Permissions are required'
                    })
                }
            }

            return validation
        }

        async submit() {
            this.touchAll()
            if (this.validate().severity === Severity.error) {
                member_modal = member_modal // Trigger reactivity
                return
            }

            if (this.permission === 'EDITOR') {
                $program.addEditor(this.user!)
            } else {
                $program.addAdmin(this.user!)
            }

            await $program.save()
            $program = $program // Trigger reactivity
            this.hide()
        }
    }

    // Variables
    let member_modal = new MemberModal()
    let query = ''

    $: filtered_admins = $program.admins.filter(admin => admin.matchesQuery(query))
    $: filtered_editors = $program.editors.filter(editor => editor.matchesQuery(query))

    let permission_options = [
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
    ]

</script>

<Modal bind:this={member_modal.modal}>
	<h3 slot="header"> New Member </h3>
	Assign a user as a member of this program. There are two types of members: editors and admins. Editors are by extention editors of all courses assigned to this program. Admins can also assign other members, change its name, assign new courses, and archive it.

	<form>
		<label for="user"> User </label>
		<Dropdown
			id="user"
			placeholder="Select a user"
			bind:value={member_modal.user}
			options={member_modal.permission === 'EDITOR' ? $program.editor_options : $program.admin_options}
		/>

        <label for="permissions"> Permissions </label>
        <Dropdown
            id="permissions"
            placeholder="Select their permissions"
            bind:value={member_modal.permission}
            options={permission_options}
            />

		<footer>
			<Button
				disabled={member_modal.validate().severity === Severity.error}
				on:click={async () => await member_modal.submit()}
			> Assign </Button>
			<Feedback data={member_modal.validate()} />
		</footer>
	</form>
</Modal>

<Card>
	<svelte:fragment slot="header">
		<h3> Members </h3>

		<div class="flex-spacer" />

		<Searchbar placeholder="Search members" bind:value={query} />
		<Button on:click={() => member_modal.show()}>
			<img src={plus_icon} alt=""> New member
		</Button>
	</svelte:fragment>

	{#if filtered_admins.length + filtered_editors.length === 0}
		<p class="grayed"> There's nothing here </p>
	{/if}

	{#each filtered_editors as editor, index}
        <UserRow index={index + 1} user={editor} />
    {/each}

    {#each filtered_admins as admin, index}
        <UserRow index={index + 1} user={admin} />
    {/each}
</Card>
