
<script lang="ts">

	// External dependencies
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'

	// Types
	type Tab = {
		id: string, 
		title: string,
		content: ConstructorOfATypedSvelteComponent, 
		props?: { [key: string]: any }
	}

	// Exports
	export let tabs: Tab[] = []

	// Functions
	function setActiveTab(id: string) {
		active_id = id
		active_tab = tabs.find(tab => tab.id === id)
		query.set('tab', id)
		goto(`?${query.toString()}`, { replaceState: true })
	}

	// Variables
	const query = $page.url.searchParams
	let active_id = query.get('tab')
	let active_tab = tabs.find(tab => tab.id === active_id)

	onMount(() => {
		if (!active_tab && tabs.length > 0) {
			setActiveTab(tabs[0].id)
		}
	})

</script> 


<!-- Markup -->


<div class="tabular">
	<div class="tabs">
		{#each tabs as { id, title }}
			<button
				class="tab"
				class:active={active_id === id}
				on:click={() => setActiveTab(id)}
			> {title} </button>
		{/each}

		<div class="dynamic-border" />
	</div>

	{#if active_tab}
		<svelte:component this={active_tab.content} {...active_tab.props} />
	{/if}
	
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