
<script lang="ts">

	// External dependencies
	import { onMount } from 'svelte'
	import { writable } from 'svelte/store'

	// Internal dependencies
	import { graph } from './stores'
	import { SubjectController, SortOption } from '$scripts/controllers'
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
	export let subject: SubjectController
	export let updateSortmode: (options: number) => void
	export let update: () => void

	// Stores
	const domain_options = writable<DropdownOption<number>[] | undefined>()
	const validation = writable<ValidationData | undefined>()
	const color = writable<string | undefined>()

	onMount(async () => {
		graph.subscribe(async () => domain_options.set(await subject.getDomainOptions()))
		graph.subscribe(async () => validation.set(await subject.validate()))
		graph.subscribe(async () => color.set(await subject.getColor()))
	})

</script>


<!-- Markdown -->


{#if $domain_options !== undefined && $validation !== undefined && $color !== undefined}
	<div class="row" id={subject.uuid}>
		<Validation compact data={$validation} />

		<IconButton scale
			src={trashIcon}
			on:click={async () => {
				await subject.delete()
				updateSortmode(SortOption.subject)
				update()
			}}
		/>

		<span> {subject.index} </span>

		<Textfield
			id="name"
			placeholder="Subject name"
			bind:value={subject.name}
			on:change={async () => await subject.save()}
			on:input={() => {
				updateSortmode(SortOption.subject)
				update()
			}}
		/>

		<Dropdown
			id="style"
			placeholder="Subject domain"
			options={$domain_options}
			bind:value={subject.domain_id}
			on:change={async () => {
				await subject.save()
				updateSortmode(SortOption.subject)
				update()
			}}
		/>


		<span class="preview" style:background-color={$color} />
	</div>
{/if}


<!-- Styles -->


<style lang="sass">

	@import './style.sass'

</style>