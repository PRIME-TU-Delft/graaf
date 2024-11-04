
<script lang="ts">

	const ROOT_URL = 'localhost:5173/app'

	// Internal dependencies
	import { course, graph_options, lecture_options } from './stores'
	import { ValidationData, Severity } from '$scripts/validation'
	import { BaseModal } from '$scripts/modals'

	import type { LectureController, LinkController } from '$scripts/controllers'
	import type { EditorView } from '$scripts/types'

	// Components
	import Validation from '$components/Validation.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Textarea from '$components/Textarea.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	import LinkURL from './LinkURL.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'

	// Helpers
	class EmbedModal extends BaseModal {
		lecture?: LectureController
		view: EditorView | null = 'domains'
		height: number = 500

		constructor() {
			super()
			this.initialize()
		}

		get embed() {
			if (!this.validate().okay()) return ''

			let embed = `<iframe src="${ROOT_URL}/graph/${$course.code}/${link.name}?view=${this.view}`
			if (this.lecture) 
				embed += `&lecture=${this.lecture.id}`
			embed += `" style="width: 100%!important; height: ${this.height}px" allow="fullscreen" allowfullscreen></iframe>`

			return embed
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.view === null) {
				result.add({
					severity: Severity.error,
					short: 'Initial view missing'
				})
			}

			if (isNaN(this.height)) {
				result.add({
					severity: Severity.error,
					short: 'Height missing or invalid'
				})
			}

			return result
		}
	}

	// Exports
	export let link: LinkController
	export let update: () => void

	$: link.getGraph()
		.then(graph => graph?.getLectureOptions() || [])
		.then(options => lecture_options.set(options))
	$: graphID_options = $graph_options.map(option => {
		return {
			value: option.value.id,
			label: option.label,
			validation: option.validation
		}
	})

	// Modal
	let embed_modal = new EmbedModal()

</script>


<!-- Markup -->


<div class="link-row">
	<IconButton scale
		src={trash_icon}
		description="Delete Link"
		on:click={async () => {
			await link.delete()
			update()
		}}
	/>

	<Textfield
		id="link-name"
		placeholder="Link Name"
		bind:value={link.name}
		on:input={() => update()}
		on:change={async () => await link.save()}
	/>

	<Dropdown
		id="graph"
		placeholder="Select a graph"
		options={graphID_options}
		bind:value={link.graph_id}
		on:change={async () => {
			await link.save()
			update()
		}}
	/>

	<LinkURL link={link} />

	<Button on:click={() => embed_modal.show()}> <b>&lt;/&gt;</b> </Button>
</div>

<Modal bind:this={embed_modal.modal}>
	<h3 slot="header"> Create Embed </h3>
	Create an embed to display this graph in your own website. You can customize the initial state and the height of the IFrame.

	{#if $lecture_options === undefined}
		<p class="grayed"> Loading... </p>
	{:else}
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
				options={[
					{ value: 'domains', label: 'Domains', validation: ValidationData.success() },
					{ value: 'subjects', label: 'Subjects', validation: ValidationData.success() },
					{ value: 'lectures', label: 'Lectures', validation: ValidationData.success() }
				]}
			/>

			<label for="lecture"> Initial Lecture </label>
			<Dropdown 
				id="lecture"
				placeholder="Select an initial lecture"
				bind:value={embed_modal.lecture}
				options={$lecture_options}
			/>

			<Textarea readonly id="embed" value={embed_modal.embed} />
		</form>
	{/if}
</Modal>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.link-row
		display: grid
		grid-template: "delete name graph url embed" auto / $total-icon-size 1fr 1fr max-content max-content
		grid-gap: $form-small-gap
		align-items: center

		padding: $input-thin-padding $input-thick-padding

		color: $dark-gray

</style>
