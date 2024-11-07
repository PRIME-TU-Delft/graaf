
<script lang="ts">

	// Internal dependencies
	import { tooltip } from "$scripts/tooltip"

	// Assets
	import copy_icon from "$assets/copy-icon.svg"

	// Exports
	export let url: string

	// Variables
	let copied: boolean = false
	$: disabled = url === ''

</script>


<!-- Markup -->



<div class="textfield">
	<input
		type="url"
		disabled={true}
		placeholder="Invalid link"
		bind:value={url}
		/>

	<button
		disabled={disabled}
		class:disabled
		use:tooltip={disabled ? 'Invalid link' : 'Copy link'}
		on:click={async () => {
			copied = true
			await navigator.clipboard.writeText(url)
			setTimeout(() => copied = false, 2000)
		}}
	>
		<img src={copy_icon} alt="Copy link" />
		<span class="popup" class:copied> Link copied! </span>
	</button>
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	div
		width: 100%
		position: relative

		input
			width: 100%
			box-sizing: border-box
			padding:
				top: $input-thin-padding
				right: calc(2 * $input-thin-padding + $input-thick-padding + $input-icon-size)
				bottom: $input-thin-padding
				left: $input-thick-padding

			border: 1px solid $gray
			border-radius: $border-radius
			background-color: $light-gray

			color: $dark-gray
			cursor: text

		button
			position: absolute
			top: 0
			right: 0

			display: flex
			justify-content: center
			align-items: center

			height: 100%
			background-color: $purple
			border-radius: 0 $border-radius $border-radius 0

			border: none
			cursor: pointer

			&:hover
				background-color: $dark-purple

			&.disabled
				background-color: $dark-gray
				cursor: not-allowed

			img
				width: $input-icon-size
				height: $input-icon-size
				margin: $input-thin-padding


				filter: $white-filter

				pointer-events: none

			.popup
				position: absolute
				bottom: calc(100% + 10px)
				z-index: 9999

				display: none

				width: max-content
				padding: 0 $input-thick-padding
				border-radius: $border-radius

				color: $white
				background: $dark-gray
				text-align: center

				pointer-events: none

				&.copied
					display: block

				&::after
					position: absolute
					translate: -50% 50%
					rotate: 45deg
					bottom: 0
					left: 50%

					content: ""

					width: 0.5rem
					height: 0.5rem

					background: $dark-gray

</style>
