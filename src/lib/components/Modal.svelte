
<script lang="ts">

	import plusIcon from '$assets/plus-icon.svg';

	export function show() { visible = true; }
	export function hide() { visible = false; }

	let visible: boolean = false;

</script>

<!-- Markup -->

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->

<div class="background" class:visible on:click|self={hide}>
	<dialog>
		<section>
			<slot name="header"> Modal </slot>
			<button class="exit" on:click={hide}>
				<img src={plusIcon} alt="Exit icon">
			</button>
		</section>

		<section>
			<slot />
		</section>
	</dialog>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.background
		display: none
		align-items: center
		justify-content: center

		position: fixed
		z-index: 999
		top: 0
		left: 0

		width: 100vw
		height: 100vh

		background-color: rgba(0, 0, 0, 0.25)

		&.visible
			display: flex

	dialog
		display: flex
		flex-flow: column nowrap
		gap: 1rem

		position: relative

		width: 100%
		max-width: $small-column
		padding: $card-thick-padding

		background-color: $white
		border-radius: $border-radius

		.exit
			display: flex
			align-items: center
			justify-content: center

			position: absolute
			top: 0
			right: 0

			margin: $card-thick-padding
			overflow: hidden

			img
				width: $input-icon-size
				rotate: 45deg

				cursor: pointer
				filter: $purple-filter

				&:hover
					scale: $scale-on-hover
					filter: $dark-purple-filter

</style>
