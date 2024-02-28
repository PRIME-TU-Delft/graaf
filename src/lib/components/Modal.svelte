
<script lang="ts">

	let showModal: boolean = false;

</script>

<!-- Markup -->

<button on:click={() => showModal = true}><slot name="trigger" /></button>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->

<div class="background" class:show={showModal} on:click|self={() => showModal = false}>
	<div class="card" on:click|stopPropagation>
		<div class=header><slot name="header" /></div>
		<slot name="body"/>
	</div>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass"

	button
		display: flex
		align-items: center
		justify-content: center

		background: none

	.background
		position: fixed
		z-index: 999
		top: 0
		left: 0

		display: none
		align-items: center
		justify-content: center

		width: 100%
		height: 100%

		background-color: rgba(0,0,0,0.25)

		.card
			width: 100%
			max-width: variables.$small-column
			padding: 1rem

			border-radius: 0.25rem
			box-shadow: 0 0 1rem rgba(0,0,0,0.25)
			background-color: variables.$white

			.header
				font-size: 1.25rem

				margin-bottom: 1rem
				padding-bottom: 0.25rem
				border-bottom: 1px solid variables.$gray
	
	.show
		display: flex

</style>
