
<script lang="ts">

	// Internal dependencies
	import { course } from './stores'

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
    class CoordinatorModal extends FormModal {
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
                coordinator_modal = coordinator_modal // Trigger reactivity
                return
            }

            if (this.permission === 'EDITOR') {
                $course.addEditor(this.user!)
            } else {
                $course.addAdmin(this.user!)
            }

            await $course.save()
            $course = $course // Trigger reactivity
            this.hide()
        }
    }

    // Variables
    let coordinator_modal = new CoordinatorModal()
    let query = ''

    $: filtered_admins = $course.admins.filter(admin => admin.matchesQuery(query))
    $: filtered_editors = $course.editors.filter(editor => editor.matchesQuery(query))

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

<Modal bind:this={coordinator_modal.modal}>
	<h3 slot="header"> Assign coordinator </h3>
	Assign a user as a coordinator for this course. There are two types of coordinators: editors and admins. Editors can edit the course, and its graphs and links. Admins can also assign other coordinators, change its code and name, assign it to programs, and archive it.

	<form>
		<label for="user"> Target User </label>
		<Dropdown
			id="user"
			placeholder="Target User"
			bind:value={coordinator_modal.user}
			options={coordinator_modal.permission === 'EDITOR' ? $course.editor_options : $course.admin_options}
		/>

        <label for="permission"> Permissions </label>
        <Dropdown
            id="permission"
            placeholder="Permissions"
            bind:value={coordinator_modal.permission}
            options={permission_options}
            />

		<footer>
			<Button
				disabled={coordinator_modal.validate().severity === Severity.error}
				on:click={async () => await coordinator_modal.submit()}
			> Assign </Button>
			<Feedback data={coordinator_modal.validate()} />
		</footer>
	</form>
</Modal>

<Card>
	<svelte:fragment slot="header">
		<h3> Coordinators </h3>

		<div class="flex-spacer" />

		<Searchbar placeholder="Search coordinators" bind:value={query} />
		<Button on:click={() => coordinator_modal.show()}>
			<img src={plus_icon} alt=""> Assign coordinator
		</Button>
	</svelte:fragment>

	{#if filtered_admins.length + filtered_editors.length === 0}
		<p class="grayed"> There's nothing here </p>
	{/if}

	{#each filtered_editors as editor}
        <UserRow user={editor} />
    {/each}

    {#each filtered_admins as admin}
        <UserRow  user={admin} />
    {/each}
</Card>
