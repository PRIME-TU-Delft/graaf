
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
	import { Graph } from "../../../classes"

	// Force reactivity update
	function update() {
		graph = graph
	}

	export let graph: Graph

	$: colorOptions = Object.keys(styles).map(color => ({ name: styles[color].display_name, value: color }))
	$: domainOptions = graph.domains.filter(domain => domain.name !== "").map(domain => ({ name: domain.name as string, value: domain }))

</script>

<!-- Markup -->

<div id="domains" class="editor">

	<div class="toolbar">
		<h2> Domains </h2>
		<LinkButton href="#subjects"> goto subjects </LinkButton>

		<div class="flex-spacer" />

		<Searchbar />
		<Button on:click={() => { graph.addDomain(); update() }}>
			<img src={plusIcon} alt=""> Add Domain
		</Button>
	</div>

	{#if graph.domains.length > 0}
		<div class=row>
			<span style="grid-area: name;"> Name </span>
			<span style="grid-area: color;"> Color </span>
		</div>
	{:else}
		<h6 class="empty"> No domains found </h6>
	{/if}

	{#each graph.domains as domain, n}
		<div class="row">
			<span class="id"> {n + 1} </span>
			<IconButton scale src={trashIcon} on:click={() => { domain.delete(); update() }} />
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
		<Button on:click={() => { graph.addSubject(); update() }}>
			<img src={plusIcon} alt=""> Add Subject
		</Button>
	</div>

	{#if graph.subjects.length > 0}
		<div class=row>
			<span class="name"> Name </span>
			<span class="color"> Color </span>
		</div>
	{:else}
		<h6 class="empty"> No subjects found </h6>
	{/if}

	{#each graph.subjects as subject, n}
		<div class="row">
			<span class="id"> {n + 1} </span>
			<IconButton scale src={trashIcon} on:click={() => { subject.delete(); update() }} />
			<Textfield label="Name" placeholder="Subject Name" bind:value={subject.name} />
			<Dropdown label="Domain" placeholder="Assigned Domain" options={domainOptions} bind:value={subject.domain} />
			<span class="preview" style:background-color={subject.preview()} />
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

			.id, .preview, :global(.icon-button)
				place-self: center center

			:global(.icon-button)
				margin-bottom: 5px

			.preview
				width: $input-icon-size
				height: $input-icon-size

</style>
