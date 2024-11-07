
<script lang="ts">

	// External dependencies
	import { onMount } from 'svelte'
	import { writable } from 'svelte/store'

	// Internal dependencies
	import { domains } from './stores'
	import { DomainController, SortOption } from '$scripts/controllers'
	import { ValidationData } from '$scripts/validation'

	import type { DropdownOption } from '$scripts/types'

	// Components
	import IconButton from '$components/IconButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Validation from '$components/Validation.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Exports
	export let domain: DomainController
	export let updateSortmode: (options: number) => void
	export let update: () => void

	// Stores
	const style_options = writable<DropdownOption<string>[] | undefined>()
	const validation = writable<ValidationData | undefined>()
	const color = writable<string | undefined>()

	onMount(async () => {
		domains.subscribe(async () => style_options.set(await domain.getStyleOptions()))
		domains.subscribe(async () => validation.set(await domain.validate()))
		domains.subscribe(async () => color.set(await domain.getColor()))
	})

</script>


<!-- Markdown -->


{#if $style_options !== undefined && $validation !== undefined && $color !== undefined}
	<div class="domain row" id={domain.uuid}>
		<Validation compact data={$validation} />

		<IconButton scale
			src={trashIcon}
			on:click={async () => {
				await domain.delete()
				updateSortmode(SortOption.domains)
				update()
			}}
		/>

		<span> {domain.index} </span>

		<Textfield
			id="name"
			placeholder="Domain Name"
			bind:value={domain.name}
			on:change={async () => await domain.save()}
			on:input={() => {
				updateSortmode(SortOption.domains)
				update()
			}}
		/>

		<Dropdown
			id="style"
			placeholder="Domain Style"
			options={$style_options}
			bind:value={domain.style}
			on:change={async () => {
				await domain.save()
				updateSortmode(SortOption.domains)
				update()
			}}
		/>


		<span class="preview" style:background-color={$color} />
	</div>
{/if}


<!-- Styles -->


<style lang="sass">

	@import './domain_styles.sass'

</style>