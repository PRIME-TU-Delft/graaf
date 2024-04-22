
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

</script>

<!-- Markup -->

<div id="domains" class="editor">

	<div class="toolbar">
		<h2> Domain relations </h2>
		<LinkButton href="#subjects"> goto subjects </LinkButton>

		<div class="flex-spacer" />

		<Searchbar />
		<Button on:click={() => { graph.addDomainRelation(); update() }}>
			<img src={plusIcon} alt=""> Add Relation
		</Button>
	</div>

	{#if graph.domainRelations.length > 0}
		<div class=row>
			<span style="grid-area: from;"> From </span>
			<span style="grid-area: to;"> To </span>
		</div>
	{:else}
		<h6 class="empty"> No relations found </h6>
	{/if}

	{#each graph.domainRelations as relation, n}
		<div class="row">
			<span class="id"> {n + 1} </span>
			<IconButton scale src={trashIcon} on:click={() => { relation.delete(); update() }} />
			<Dropdown label="From" placeholder="From Domain" options={relation.getFromOptions()} bind:value={relation.from} />
			<span class="preview" style:background-color={relation.fromPreview()} />
			<Dropdown label="To" placeholder="To Domain" options={relation.getToOptions()} bind:value={relation.to} />
			<span class="preview" style:background-color={relation.toPreview()} />
		</div>
	{/each}

</div>

<div id="subjects" class="editor">

	<div class="toolbar">
		<h2> Subject relations </h2>
		<LinkButton href="#domains"> goto domains </LinkButton>

		<div class="flex-spacer" />

		<Searchbar />
		<Button on:click={() => { graph.addSubjectRelation(); update() }}>
			<img src={plusIcon} alt=""> Add Relation
		</Button>
	</div>

	{#if graph.subjectRelations.length > 0}
		<div class=row>
			<span style="grid-area: from;"> From </span>
			<span style="grid-area: to;"> To </span>
		</div>
	{:else}
		<h6 class="empty"> No subjects found </h6>
	{/if}

	{#each graph.subjectRelations as relation, n}
		<div class="row">
			<span class="id"> {n + 1} </span>
			<IconButton scale src={trashIcon} on:click={() => { relation.delete(); update() }} />
			<Dropdown label="From" placeholder="From Subject" options={relation.getFromOptions()} bind:value={relation.from} />
			<span class="preview" style:background-color={relation.fromPreview()} />
			<Dropdown label="To" placeholder="To Subject" options={relation.getToOptions()} bind:value={relation.to} />
			<span class="preview" style:background-color={relation.toPreview()} />
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
			grid-template: "id delete from fp to tp" auto / $icon-width $icon-width 1fr $icon-width 1fr $icon-width
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
