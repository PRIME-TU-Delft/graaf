
<script lang="ts">

	let showModal: boolean = false;

</script>

<!-- Markup -->

<button on:click={() => showModal = true}><slot name="trigger" /></button>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->

<div class="background" class:show={showModal} on:click|self={() => showModal = false}>
	<dialog on:click|stopPropagation>
		<h1><slot name="header"> Modal </slot></h1>
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

		background-color: rgba(0,0,0,0.25)

	.show
		display: flex

	dialog
		position: static
		display: block

		width: 100%
		max-width: variables.$small-column
		padding: 1rem

		border-radius: variables.$border-radius
		box-shadow: 0 0 1rem rgba(0, 0, 0, 0.25)
		background-color: variables.$white

		h1
			font-size: 1.25rem

			margin-bottom: 1rem
			padding-bottom: 0.25rem
			border-bottom: 1px solid variables.$gray

		.body
			padding: 0 1rem
	
	button
		display: flex
		align-items: center
		justify-content: center

		background: none

</style>
