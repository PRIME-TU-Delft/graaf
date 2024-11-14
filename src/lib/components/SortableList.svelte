
<script lang="ts">

	import { flip } from 'svelte/animate'

	export let list: any[]

	let origin: number | null = null
	let animating: boolean = false

	const ANIMATION_DURATION = 100

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
		if (!animating && data.index !== origin && origin !== null) {
			rearrange(origin, data.index)
			origin = data.index
		} 
	}

	function onDragEnd(event: DragEvent) {
		origin = null
	}

	function rearrange(source: number, target: number) {
		const new_list = [...list]
		const moved = new_list.splice(source, 1)
		new_list.splice(target, 0, moved[0])
		animating = true
		list = new_list

		setTimeout(() => {
			animating = false
		}, ANIMATION_DURATION)
	}

</script>

{#if list?.length}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="list">
		{#each list as item, index (item.id)}

			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="row"
				class:dragging={index == origin}
				data-id={item.id}
				data-index={index}
				on:dragover|preventDefault={onDragOver}
				animate:flip={{ duration: ANIMATION_DURATION }}
			>
				<!-- Drag handle element -->
				<div
					class="handle"
					draggable="true"
					on:dragstart={onDragStart}
					on:dragend|preventDefault={onDragEnd}
				> ⠿ </div>

				<slot {item} {index} />
			</div>
		{/each}
	</div>
{/if}

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *


	.list
		display: flex
		flex-flow: column nowrap
		align-items: center

		.row
			display: flex
			flex-flow: row nowrap
			justify-content: flex-start
			align-items: center

			width: 100%
			height: $list-row-height
			padding: $input-thin-padding $input-thick-padding

			.handle
				display: flex
				justify-content: center
				align-items: center

				width: $total-icon-size
				height: $total-icon-size

				cursor: grab
				user-select: none

</style>