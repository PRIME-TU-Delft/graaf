
<script lang="ts">

	// Internal imports
	import { LinkController } from "$scripts/controllers"

	// Assets
	import copyIcon from "$assets/copy-icon.svg"

	// Exports
	export let link: LinkController

	// Variables
	let value: string = ''
	$: link.getURL().then(
		url => value = url,
		() => value = ''
	)

</script>


<!-- Markup -->


<div class="textfield">
	<input
		disabled={true}
		placeholder="Invalid link"
		type="url"
		bind:value
		/>

	<button
		disabled={value === ''}
		on:click={() => navigator.clipboard.writeText(value)}
		>

		<img src={copyIcon} alt="Copy link" />
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

			&::disabled
				background-color: $dark-gray
				cursor: not-allowed

			img
				width: $input-icon-size
				height: $input-icon-size
				margin: $input-thin-padding
				

				filter: $white-filter

				pointer-events: none

</style>
