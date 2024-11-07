
<script lang="ts">

	// External dependencies
	import { onMount } from 'svelte'
	import { writable } from 'svelte/store'

	// Internal dependencies
	import { graph } from './stores'
	import { DomainRelationController, SortOption } from '$scripts/controllers'
	import { ValidationData } from '$scripts/validation'

	import type { DomainController } from '$scripts/controllers'
	import type { DropdownOption } from '$scripts/types'

	// Components
	import IconButton from '$components/IconButton.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Validation from '$components/Validation.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Exports
	export let relation: DomainRelationController
	export let updateSortmode: (options: number) => void
	export let update: () => void

	// Store
	const validation = writable<ValidationData | undefined>()
	const parent_options = writable<DropdownOption<DomainController>[] | undefined>()
	const parent_color = writable<string | undefined>()
	const child_options = writable<DropdownOption<DomainController>[] | undefined>()
	const child_color = writable<string | undefined>()

	onMount(async () => {
		graph.subscribe(async () => validation.set(await relation.validate()))
		graph.subscribe(async () => parent_options.set(await relation.getParentOptions()))
		graph.subscribe(async () => parent_color.set(await relation.getParentColor()))
		graph.subscribe(async () => child_options.set(await relation.getChildOptions()))
		graph.subscribe(async () => child_color.set(await relation.getChildColor()))
	})

</script>


<!-- Markdown -->


{#if $validation !== undefined && $parent_options !== undefined && $parent_color !== undefined && $child_options !== undefined && $child_color !== undefined}
	<div class="relation row" id={relation.uuid}>
		<Validation compact data={$validation} />

		<IconButton scale
			src={trashIcon}
			on:click={() => {
				relation.delete()
				updateSortmode(SortOption.relations)
				update()
			}}
		/>

		<span> {relation.index} </span>

		<Dropdown
			id="parent"
			placeholder="Relation parent"
			options={$parent_options}
			bind:value={relation.parent}
			on:change={async () => {
				await relation.save()
				updateSortmode(SortOption.relations)
				update()
			}}
		/>

		<span class="preview" style:background-color={$parent_color} />

		<Dropdown
			id="child"
			placeholder="Relation child"
			options={$child_options}
			bind:value={relation.child}
			on:change={async () => {
				await relation.save()
				updateSortmode(SortOption.relations)
				update()
			}}
		/>

		<span class="preview" style:background-color={$child_color} />
	</div>
{/if}


<!-- Styles -->


<style lang="sass">

	@import './domain_styles.sass'

</style>