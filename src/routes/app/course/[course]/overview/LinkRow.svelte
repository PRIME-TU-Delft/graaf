
<script lang="ts">

	// Internal dependencies
	import * as settings from '$scripts/settings'
	import { course } from './stores'

	import { Validation, Severity } from '$scripts/validation'
	import { AbstractFormModal } from '$scripts/modals'

	import type { LectureController, LinkController } from '$scripts/controllers'
	import type { EditorView } from '$scripts/types'

	// Components
	import LinkURL from './LinkURL.svelte'

	import SimpleModal from '$components/SimpleModal.svelte'
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import FormModal from '$components/FormModal.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Textarea from '$components/Textarea.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Feedback from '$components/Feedback.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'

	// Modals
	class EmbedModal extends AbstractFormModal {
		lecture?: LectureController
		view: EditorView | null = 'lectures'
		height: number = 500
		copied: boolean = false

		constructor() {
			super(false)
			this.initialize()
		}

		get embed() {
			if (this.validate().severity === Severity.error) return ''
			let embed = `<iframe src="${settings.ROOT_URL}/app/course/${$course.trimmed_code}/${link.trimmed_name}?view=${this.view}`
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

		async submit() {
			await navigator.clipboard.writeText(embed_modal.embed)
			embed_modal.copied = true
			setTimeout(() => embed_modal.copied = false, 2000)
		}
	}

	// Main
	export let link: LinkController

	const embed_modal = new EmbedModal()
	const view_options = [
		{ value: 'domains', label: 'Domains', validation: Validation.success() },
		{ value: 'subjects', label: 'Subjects', validation: Validation.success() },
		{ value: 'lectures', label: 'Lectures', validation: Validation.success() }
	]

	let delete_modal: SimpleModal

</script>

<!-- Markup -->

<FormModal controller={embed_modal}>
	<h3 slot="header"> Create Embed </h3>
	Create an embed to display this graph in your own website. You can customize the initial state and the height of the IFrame.

	<svelte:fragment slot="form">
		<label for="height"> IFrame Height </label>
		<Textfield id="height" type="number" bind:value={embed_modal.height} />

		<label for="view"> Initial View </label>
		<Dropdown
			placeholder="Select an initial view" 
			bind:value={embed_modal.view} 
			options={view_options} 
		/>

		<label for="lecture"> Initial Lecture </label>
		<Dropdown
			placeholder="Select an initial lecture"
			bind:value={embed_modal.lecture}
			options={link.graph?.lecture_options || []}
		/>

		<div /> <!-- Spacer -->

		<Textarea readonly id="embed" value={embed_modal.embed} />
	</svelte:fragment>

	<svelte:fragment slot="submit">
		{#if embed_modal.copied}
			Embed Copied!
		{:else}
			Copy Embed
		{/if}
	</svelte:fragment>
</FormModal>

<SimpleModal bind:this={delete_modal}>
	<h3 slot="header"> Delete Link </h3>
	Are you sure you want to delete this link? This will invalidate every reference and embed associated to this link. This action cannot be undone.

	<svelte:fragment slot="footer">
		<LinkButton
			on:click={() => delete_modal.hide()}
		> Cancel </LinkButton>

		<Button
			on:click={async () => {
				await link.delete()
				$course = $course // Trigger reactivity
			}}
		> Delete </Button>
	</svelte:fragment>
</SimpleModal>

<div class="row">
	<Feedback compact data={link.validate(false)} />

	<IconButton scale
		src={trash_icon}
		description="Delete Link"
		on:click={async () => {
			if (link.is_empty) {
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
		on:input={async () => {
			await link.save()
			$course = $course // Trigger reactivity
		}}
	/>

	<Dropdown
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

	.row
		display: grid
		grid-template: "validation delete name graph url embed" auto / $total-icon-size $total-icon-size 3fr 3fr 2fr 62px
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
