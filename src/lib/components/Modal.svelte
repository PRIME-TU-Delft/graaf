
<script lang="ts">

	import plusIcon from '$assets/plus-icon.svg';

	let showModal: boolean = false;
	function show() { showModal = true; }
	function hide() { showModal = false; }

</script>

<!-- Markup -->

<button class="trigger" on:click={show}><slot name="trigger" /></button>

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

	@use "$styles/variables.sass"

	.background
		position: fixed
		z-index: 999
		top: 0
		left: 0

		display: none
		align-items: center
		justify-content: center

		width: 100vw
		height: 100vh

		background-color: rgba(0, 0, 0, 0.25)

	.show
		display: flex

	dialog
		position: relative

		display: block
		width: 100%
		max-width: variables.$small-column
		padding: 1rem

		background-color: variables.$white
		border-radius: variables.$border-radius

		.exit
			position: absolute
			top: 0
			right: 0

			margin: 0.625rem

			&:hover
				cursor: pointer
				
				img
					filter: variables.$dark-purple-filter
					transform: rotate(45deg) scale(1.1)
			
			img
				height: 1.5rem
				transform: rotate(45deg)

				filter: variables.$purple-filter
				transition: all 0.15s ease-in-out

				&:hover
					cursor: pointer
					filter: variables.$dark-purple-filter
					transform: rotate(45deg) scale(1.1)

		.header
			width: 100%
			margin-bottom: 1rem
			padding-bottom: 0.25rem

			font-size: 1.25rem
			border-bottom: 1px solid variables.$gray


		.body
			width: 100%
			padding: 0 1rem
	
	button
		display: flex
		align-items: center
		justify-content: center

		background: none

</style>
