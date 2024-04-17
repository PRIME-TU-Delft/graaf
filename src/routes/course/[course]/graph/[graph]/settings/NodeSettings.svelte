
<!-- Script -->

<script lang="ts">

	import Textfield from "$components/Textfield.svelte"
	import Dropdown from "$components/Dropdown.svelte"
	import Searchbar from "$components/Searchbar.svelte"
	import Button from "$components/Button.svelte"
	import IconButton from "$components/IconButton.svelte"
	import LinkButton from "$components/LinkButton.svelte"

	import trashIcon from "$assets/trash-icon.svg"
	import plusIcon from "$assets/plus-icon.svg"

	import { styles } from "$scripts/graph/settings"

	export let domains: Domain[] = []
	export let subjects: Subject[] = []

	$: colorOptions = Object.keys(styles).map(color => ({ name: styles[color].display_name, value: color }))
	$: domainOptions = domains.filter(domain => domain.name !== "").map(domain => ({ name: domain.name, value: domain.id }))

	class Domain {
		id: number
		name: string = ""
		color: string | undefined = undefined

		constructor() {

			// Set id to first unused id
			this.id = domains.length > 0 ? Math.max(...domains.map(domain => domain.id)) + 1 : 0

			// Set color to first unused color
			for (let color of Object.keys(styles)) {
				if (domains.every(domain => domain.color !== color)) {
					this.color = color
					break
				}
			}
		}

		static find(id: number) {
			let domain = domains.find(domain => domain.id === id)
			if (domain === undefined) throw new Error("Domain not found")
			return domain
		}

		static add() {
			domains = [...domains, new Domain()];
		}

		delete(_: any) {
			domains = domains.filter(domain => domain !== this);
			for (let subject of subjects) {
				if (subject.domain === this.id) {
					subject.domain = undefined
				}
			}
		}

		preview() {
			return this.color === undefined ? "transparent" : styles[this.color].stroke
		}
	}

	class Subject {
		id: number
		name: string = ""
		domain: number | undefined = undefined

		constructor() {

			// Set id to first unused id
			this.id = subjects.length > 0 ? Math.max(...subjects.map(subject => subject.id)) + 1 : 0
		}
		
		static add() {
			subjects = [...subjects, new Subject()]
		}

		delete(_: any) {
			subjects = subjects.filter(subject => subject !== this)
		}

		preview(_: any) {
			if (this.domain === undefined)
				return "transparent"
			return Domain.find(this.domain).preview()
		}
	}

</script>

<!-- Markup -->

<div id="domains" class="editor">

	<div class="toolbar">
		<h2> Domains </h2>
		<LinkButton href="#subjects"> goto subjects </LinkButton>
		<div class="flex-spacer" />
		<Searchbar />
		<Button on:click={Domain.add}> <img src={plusIcon} alt=""> Add Domain </Button>
	</div>

	{#if domains.length > 0}
		<div class=row>
			<span class="name"> Name </span>
			<span class="color"> Color </span>
		</div>
	{:else}
		<h6 class="empty"> No domains found </h6>
	{/if}

	{#each domains as domain, n}
		<div class="row">
			<span class="id"> {n + 1} </span>
			<IconButton scale src={trashIcon} on:click={() => domain.delete(domains)} />
			<Textfield label="Name" placeholder="Domain Name" bind:value={domain.name} />
			<Dropdown label="Color" placeholder="Domain Color" options={colorOptions} bind:value={domain.color}/>
			<span class="preview" style:background-color={domain.preview()} />
		</div>
	{/each}

</div>

<div id="subjects" class="editor">

	<div class="toolbar">
		<h2> Subjects </h2>
		<LinkButton href="#domains"> goto domains </LinkButton>
		<div class="flex-spacer" />
		<Searchbar />
		<Button on:click={Subject.add}> <img src={plusIcon} alt=""> Add Subject </Button>
	</div>

	{#if subjects.length > 0}
		<div class=row>
			<span class="name"> Name </span>
			<span class="color"> Color </span>
		</div>
	{:else}
		<h6 class="empty"> No subjects found </h6>
	{/if}

	{#each subjects as subject, n}
		<div class="row">
			<span class="id"> {n + 1} </span>
			<IconButton scale src={trashIcon} on:click={() => subject.delete(subjects)} />
			<Textfield label="Name" placeholder="Subject Name" bind:value={subject.name} />
			<Dropdown label="Domain" placeholder="Assigned Domain" options={domainOptions} bind:value={subject.domain} />
			<span class="preview" style:background-color={subject.preview(domains)} />
		</div>
	{/each}

</div>

<!-- Styles -->

<style lang="sass">

	@use '$styles/variables.sass' as *
	@use '$styles/palette.sass' as *

	$icon-width: calc($input-icon-size + 2 * $input-icon-padding)

	.editor
		display: flex
		flex-flow: column nowrap
		padding: $card-thick-padding
		gap: $form-small-gap

		.toolbar
			display: flex
			flex-flow: row nowrap
			margin-bottom: $form-big-gap
			gap: $form-small-gap
		
		.empty
			margin: auto
			color: $gray

		.row
			display: grid
			grid-template: "id delete name color preview" auto / $icon-width $icon-width 1fr 1fr $icon-width
			gap: $form-small-gap
			width: 100%

			.id
				grid-area: id
				place-self: center center

			.name, :global(.text-field)
				grid-area: name

			.color, :global(.dropdown)
				grid-area: color

			:global(.icon-button)
				grid-area: delete
				place-self: center center

				margin-bottom: 5px

			.preview
				grid-area: preview
				place-self: center center

				width: $input-icon-size
				height: $input-icon-size

</style>
