
<script lang="ts">

	import plusIcon from '$assets/plus-icon.svg';

	export function show() { showModal = true; }
	export function hide() { showModal = false; }

	let showModal: boolean = false;

</script>

<!-- Markup -->

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->

<div class="background" class:show={showModal} on:click|self={hide}>
	<dialog on:click|stopPropagation>
		<section class="header">
			<slot name="header"> Modal </slot>
			<button class="exit" on:click={hide}>
				<img src={plusIcon} alt="Exit icon">
			</button>
		</section>

		<section class="body">
			<slot> Lorum ipsum dolor sid amed. </slot>
		</section>
	</dialog>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.background
		display: flex
		align-items: center
		justify-content: center

		position: fixed
		z-index: 999
		top: 0
		left: 0

		width: 100vw
		height: 100vh

		background-color: rgba(0, 0, 0, 0.25)

		&:not(.show)
			display: none

	dialog
		display: flex
		flex-flow: column nowrap
		gap: $layout-vertical-gap
		
		position: relative
		
		width: 100%
		max-width: $small-column
		padding: $card-thick-padding

		background-color: $white
		border-radius: $border-radius

		.exit
			position: absolute
			top: 0
			right: 0

			margin: $card-thick-padding
			overflow: hidden
			
			img
				height: $input-icon-size
				rotate: 45deg

				filter: $purple-filter
				transition: all $default-transition
			
				&:hover
					cursor: pointer
					scale: $scale-on-hover
					filter: $dark-purple-filter

</style>
