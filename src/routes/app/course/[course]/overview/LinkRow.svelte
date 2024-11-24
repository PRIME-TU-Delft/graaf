
<script lang="ts">

	// Internal dependencies
	import * as settings from '$scripts/settings'

	import { course } from './stores'
	import { Validation, Severity } from '$scripts/validation'
	import { FormModal, SimpleModal } from '$scripts/modals'

	import type { LectureController, LinkController } from '$scripts/controllers'
	import type { EditorView } from '$scripts/types'

	// Components
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Textarea from '$components/Textarea.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Feedback from '$components/Feedback.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	import LinkURL from './LinkURL.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'
	import copy_icon from '$assets/copy-icon.svg'

	// Helpers
	class EmbedModal extends FormModal {
		lecture?: LectureController
		view: EditorView | null = 'lectures'
		height: number = 500
		copied: boolean = false

		constructor() {
			super()
			this.initialize()
		}

		get embed() {
			if (this.validate().severity === Severity.error) return ''
			let embed = `<iframe src="${settings.ROOT_URL}/app/course/${$course.code}/${link.name}?view=${this.view}`
			if (this.lecture) embed += `&lecture=${this.lecture.id}`
			embed += `" style="width: 100%!important; height: ${this.height}px" allow="fullscreen" allowfullscreen></iframe>`

			return embed
		}

		validate(): Validation {
			const validation = new Validation()

			if (this.view === null) {
				validation.add({
					severity: Severity.error,
					short: 'Initial view missing'
				})
			}

			if (isNaN(this.height)) {
				validation.add({
					severity: Severity.error,
					short: 'Height missing or invalid'
				})
			}

			return validation
		}
	}

	class DeleteModal extends SimpleModal {
		async submit() {
			this.disabled = true
			delete_modal = delete_modal // Trigger reactivity
			await link.delete()
			$course = $course // Trigger reactivity
			this.hide()
		}
	}

	// Exports
	export let link: LinkController

	// Modal
	let embed_modal = new EmbedModal()
	let delete_modal = new DeleteModal()

	// Options
	let view_options = [
		{ value: 'domains', label: 'Domains', validation: Validation.success() },
		{ value: 'subjects', label: 'Subjects', validation: Validation.success() },
		{ value: 'lectures', label: 'Lectures', validation: Validation.success() }
	]

</script>


<!-- Markup -->

<Modal bind:this={embed_modal.modal}>
	<h3 slot="header"> Create Embed </h3>
	Create an embed to display this graph in your own website. You can customize the initial state and the height of the IFrame.

	<form>
		<label for="height"> IFrame Height </label>
		<Textfield 
			id="height" 
			type="number" 
			bind:value={embed_modal.height}
		/>

		<label for="view"> Initial View </label>
		<Dropdown 
			id="view"
			placeholder="Select an initial view"
			bind:value={embed_modal.view}
			options={view_options}
		/>

		<label for="lecture"> Initial Lecture </label>
		<Dropdown 
			id="lecture"
			placeholder="Select an initial lecture"
			bind:value={embed_modal.lecture}
			options={link.graph?.lecture_options || []}
		/>

		<Textarea readonly id="embed" value={embed_modal.embed} />

		<footer>
			<Button
				on:click={async () => {
					embed_modal.copied = true
					await navigator.clipboard.writeText(embed_modal.embed)
					setTimeout(() => embed_modal.copied = false, 2000)
				}}
			>
				{#if embed_modal.copied}
					Embed Copied!
				{:else}
					Copy Embed
				{/if}
			</Button>
		</footer>
	</form>
</Modal>

<Modal bind:this={delete_modal.modal}>
	<h3 slot="header"> Delete Link </h3>
	Are you sure you want to delete this link? This action cannot be undone.

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => delete_modal.hide()}> Cancel </LinkButton>
		<Button
			disabled={delete_modal.disabled}
			on:click={async () => await delete_modal.submit()}
		> Delete </Button>
	</svelte:fragment>
</Modal>

<div class="link-row">
	<Feedback compact data={link.validate(false)} animate={false} />

	<IconButton scale
		src={trash_icon}
		description="Delete Link"
		on:click={async () => {
			if (link.unchanged) {
				await link.delete()
				$course = $course // Trigger reactivity
			} else {
				delete_modal.show()
			}
		}}
	/>

	<Textfield
		id="link-name"
		placeholder="Link Name"
		bind:value={link.name}
		on:change={async () => {
			await link.save()
			$course = $course // Trigger reactivity
		}}
	/>

	<Dropdown
		id="graph"
		placeholder="Select a graph"
		options={$course.graph_options}
		bind:value={link.graph}
		on:change={async () => {
			await link.save()
			$course = $course // Trigger reactivity
		}}
	/>

	<LinkURL url={link.url} />
	<Button
		disabled={link.validate().severity === Severity.error}
		on:click={() => embed_modal.show()}
	> <b>&lt;/&gt;</b> </Button>
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.link-row
		display: grid
		grid-template: "validation delete name graph url embed" auto / $total-icon-size $total-icon-size 1fr 1fr max-content max-content
		grid-gap: $form-small-gap
		place-items: center

		padding:
			top: $input-thin-padding
			right: calc($input-thick-padding + $total-icon-size + $form-small-gap)
			left: $input-thick-padding

		color: $dark-gray

		&:last-child
			padding-bottom: $input-thin-padding
	
</style>
