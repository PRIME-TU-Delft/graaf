
<script lang="ts">

	// Exports
	export let tabs: { 
		title: string,
		content: ConstructorOfATypedSvelteComponent, 
		props?: { [key: string]: any }
	}[] = []

	export let active: number = 0
	
</script>


<!-- Markup -->


<div class="tabular">
	<div class="tabs">
		{#each tabs as { title }, n}
			<button
				class="tab"
				class:active={active === n}
				on:click={() => active = n}
			> {title} </button>
		{/each}

		<div class="dynamic-border" />
	</div>

	{#each tabs as { content, props }, n}
		{#if active === n}
			<svelte:component this={content} {...props} />
		{/if}
	{/each}
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.tabular
		border-radius: $border-radius
		border: 1px solid $gray

		.tabs
			display: flex
			background: $light-gray
			border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

			.tab
				padding: $card-thin-padding $card-thick-padding

				border-color: $gray
				border-style: solid
				border-width: 0 0 1px 1px
				border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

				&.active
					background: $white
					border-width: 0 1px 0 1px

					& ~ .tab
						border-width: 0 1px 1px 0


				&:first-child
					border-left: none !important

			.dynamic-border
				border-bottom: 1px solid $gray
				flex: 1

</style>