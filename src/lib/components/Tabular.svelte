
<script lang="ts">

	// External dependencies
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'

	// Exports
	export let tabs: { 
		title: string,
		content: ConstructorOfATypedSvelteComponent, 
		props?: { [key: string]: any }
	}[] = []

	// Functions
	function setActiveTab(n: number) {
		active = n
		query.set('tab', n.toString())
		goto(`?${query.toString()}`, { replaceState: true })
	}

	// Variables
	const query = $page.url.searchParams
	let active: number | undefined

	// Initialization
	onMount(() => {
		if (query.has('tab')) {
			const tab = Number(query.get('tab'))
			if (!isNaN(tab) && tab >= 0 && tab < tabs.length) {
				active = tab
			}
		}

		if (active === undefined) {
			active = 0
			query.set('tab', '0')
			goto(`?${query.toString()}`, { replaceState: true })
		}
	})

</script>


<!-- Markup -->


<div class="tabular">
	<div class="tabs">
		{#each tabs as { title }, n}
			<button
				class="tab"
				class:active={active === n}
				on:click={() => setActiveTab(n)}
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