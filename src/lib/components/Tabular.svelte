
<script lang="ts">

	// Types
	type T = ConstructorOfATypedSvelteComponent | null | undefined

	// Exports
	export let tabs: { content: T, title: string }[] = []
	export let active: number = 0
	
</script>



<!-- Markup -->



<div class="card">
	<div class="tabs">
		{#each tabs as tab, index}
			<button class="tab" class:active={index === active} on:click={() => active = index}>
				{tab.title}
			</button>
		{/each}

		<div class="dynamic-border" />
	</div>

	<svelte:component this={tabs[active].content} />
</div>



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.card
		border-radius: $border-radius
		border: 1px solid $gray

		.tabs
			display: flex
			flex-flow: row nowrap

			background: $light-gray
			border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

			.dynamic-border
				flex: 1
				border-bottom: 1px solid $gray

			.tab
				display: block
				margin: 0
				padding: $card-thin-padding $card-thick-padding

				border-color: $gray
				border-style: solid
				border-width: 0 0 1px 1px
				border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

				text-align: left

				&.active
					background: $white
					border-width: 0 1px 0 1px

					& ~ .tab
						border-width: 0 1px 1px 0


				&:first-child
					border-left: none !important

</style>
