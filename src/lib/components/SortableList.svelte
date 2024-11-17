
<script lang="ts">

	// External dependencies
	import { createEventDispatcher } from 'svelte'
	import { flip } from 'svelte/animate'

	// Internal dependencies
	import * as settings from '$scripts/settings'
	import type { Validation } from '$scripts/validation'

	// Components
	import Feedback from '$components/Feedback.svelte'

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
		const data = getDataset(event.target)
		if (!animating.includes(data.id) && data.index !== origin && origin !== null) {
			rearrange(data.id, origin, data.index)
			origin = data.index
		} 
	}

	function onDragEnd(_: DragEvent) {
		dispatch('rearrange', list)
		origin = null
	}

	function rearrange(dropzone: number, from: number, to: number) {
		const new_list = [...list]
		const moved = new_list.splice(from, 1)
		new_list.splice(to, 0, moved[0])
		list = new_list

		animating.push(dropzone)

		setTimeout(() => {
			animating = animating.filter(id => id !== dropzone)
		}, settings.LIST_FLIP_DURATION)
	}

	// Variables
	export let list: T[] & { uuid: string, validate: (strict: boolean) => Validation }[]

	const dispatch = createEventDispatcher<{rearrange: T[]}>()
	
	let origin: number | null = null // Index of the element being dragged
	let animating: number[] = []	 // List of elements currently being animated

	type T = $$Generic

</script>

<div class="list">
	{#each list as item, index (item.uuid)}

		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="row"
			class:dragging={index == origin}
			data-index={index}
			data-uuid={item.uuid}
			on:dragover|preventDefault={onDragOver}
			animate:flip={{ duration: settings.LIST_FLIP_DURATION }}
		>
			<!-- Validation -->
			<Feedback compact animate={false} data={item.validate(false)} />

			<!-- Drag handle -->
			<div
				class="handle"
				draggable="true"
				on:dragstart={onDragStart}
				on:dragend|preventDefault={onDragEnd}
			> ⠿ </div>

			<slot {item} />
		</div>
	{/each}
</div>

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *


	.list
		display: flex
		flex-flow: column nowrap
		gap: $form-small-gap

		.row
			display: grid
			grid-template: "validate handle content" auto / $total-icon-size $total-icon-size 1fr
			place-items: center center
			grid-gap: $form-small-gap

			width: 100%

			.handle
				display: flex
				justify-content: center
				align-items: center

				width: $total-icon-size
				height: $total-icon-size

				cursor: ns-resize
				user-select: none
				color: $dark-gray

</style>