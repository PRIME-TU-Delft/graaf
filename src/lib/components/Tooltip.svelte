
<script lang="ts">

	// Exports
	export let text: string
	export let x: number
	export let y: number

</script>


<!-- Markup -->

<svelte:options accessors/>

<span
	class="tooltip"
	style:top="{y}px"
	style:left="{x}px"
>
	{text}
</span>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.tooltip
		position: absolute
		translate: -50% calc(-100% - 10px)
		z-index: 9999

		width: max-content
		padding: 0 $input-thick-padding
		border-radius: $border-radius

		color: $white
		background: $dark-gray
		text-align: center

		pointer-events: none

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
