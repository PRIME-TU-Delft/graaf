
<script lang="ts">

	const DROPZONE = 10

	// External dependencies
	import { createEventDispatcher } from 'svelte'
	import { flip } from 'svelte/animate'

	// Internal dependencies
	import * as settings from '$scripts/settings'
	import type { Validation } from '$scripts/validation'

	// Assets
	import dnd_icon from '$assets/dnd-icon.svg'

	// Functions
	function getDataset(node: any) {
		if (!node.dataset.index) {
			return getDataset(node.parentElement)
		} else {
			return { ...node.dataset }
		}
	}

	function onDragStart(event: DragEvent) {
		const target = event.target as HTMLElement
		const data = getDataset(target)

		origin = data.index
	}

	function onDragOver(event: DragEvent) {
		const target = event.target as HTMLElement
		const data = getDataset(target)

		if (origin === null // Not dragging (very strange case)
		 || data.index === origin // Dragging over itself
		 || data.index > origin && event.offsetY < target.clientHeight - DROPZONE // Dragging down, but not close enough
		 || data.index < origin && event.offsetY > DROPZONE // Dragging up, but not close enough
		) return

		rearrange(origin, data.index)
		origin = data.index
	}

	function onDragEnd(_: DragEvent) {
		dispatch('rearrange', list)
		origin = null
	}

	function rearrange(from: number, to: number) {
		const new_list = [...list]
		const moved = new_list.splice(from, 1)
		new_list.splice(to, 0, moved[0])
		list = new_list
	}

	// Main
	type T = $$Generic
	export let list: T[] & { uuid: string, validate: (strict: boolean) => Validation }[]
	let origin: number | null = null // Index of the element being dragged

	const dispatch = createEventDispatcher<{rearrange: T[]}>()

</script>

<!-- Markup -->

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="list" on:dragover|preventDefault>
	{#each list as item, index (item.uuid)}

		<div
			class="row"
			data-index={index}
			on:dragover|preventDefault={onDragOver}
			animate:flip={{ duration: settings.UNIVERSAL_FADE_DURATION }}
		>
			<slot name="left" {item} />

			<img
				src={dnd_icon} alt="Drag handle"
				class="handle"
				draggable="true"
				on:dragstart={onDragStart}
				on:dragend|preventDefault={onDragEnd}
			>

			<slot name="right" {item} />
		</div>
	{/each}
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.list
		display: flex
		flex-flow: column nowrap
		gap: $form-small-gap

		.row
			display: flex
			flex-flow: row nowrap
			align-items: center
			gap: $form-small-gap

			.handle
				align-self: start
				width: $total-icon-size
				height: calc( 1.5rem + 2 * $input-thin-padding + 2px )
				padding: 0.4rem

				cursor: move

				filter: $dark-purple-filter

</style>