
<!-- Markup -->

<section class="row">
	{#if $$slots.center}
		<div class="center"><slot name="center" /></div>
	{/if}

	{#if $$slots.left || $$slots.right}
		<div class="left"><slot name="left" /></div>
		<div class="right"><slot name="right" /></div>
	{/if}
</section>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.row
		display: flex
		flex-flow: row wrap
		align-items: center

		width: 100%

		.center
			display: flex
			flex-flow: row wrap
			align-items: center
			justify-content: center
	
			flex: 1 1 100%
	
		.left
			flex: 2 1 40%
	
		.right
			flex: 3 1 60%

</style>
