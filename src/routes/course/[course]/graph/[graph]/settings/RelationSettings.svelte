
<!-- Script -->

<script lang="ts">

	import Button from "$components/Button.svelte"
	import Dropdown from "$components/Dropdown.svelte"
	import IconButton from "$components/IconButton.svelte"
	import LinkButton from "$components/LinkButton.svelte"
	import Searchbar from "$components/Searchbar.svelte"

	import plusIcon from "$assets/plus-icon.svg"
	import trashIcon from "$assets/trash-icon.svg"

	import { Graph, DomainRelation, SubjectRelation } from "$scripts/entities"

	export let graph: Graph

	// Force reactivity update
	function update() {
		graph = graph
	}


</script>

<!-- Markup -->

<div id="domains" class="editor">

	<div class="toolbar">
		<h2> Domain relations </h2>
		<LinkButton href="#subjects"> goto subjects </LinkButton>

		<div class="flex-spacer" />

		<Searchbar />
		<Button on:click={() => { DomainRelation.create(graph); update() }}>
			<img src={plusIcon} alt=""> Add Relation
		</Button>
	</div>

	{#if graph.domainRelations.length > 0}
		<div class=row>
			<span style="grid-area: left;"> From </span>
			<span style="grid-area: right;"> To </span>
		</div>
	{:else}
		<h6 class="empty"> No relations found </h6>
	{/if}

	{#each graph.domainRelations as relation, n}
		<div class="row">
			<span class="id"> {n + 1} </span>
			<IconButton scale src={trashIcon} on:click={() => { relation.delete(); update() }} />
			<Dropdown label="Parent" placeholder="From Domain" options={relation.parentOptions()} bind:value={relation.parent} />
			<span class="preview" style:background-color={relation.parentColor()} />
			<Dropdown label="Child" placeholder="To Domain" options={relation.childOptions()} bind:value={relation.child} />
			<span class="preview" style:background-color={relation.childColor()} />
		</div>
	{/each}

</div>

<div id="subjects" class="editor">

	<div class="toolbar">
		<h2> Subject relations </h2>
		<LinkButton href="#domains"> goto domains </LinkButton>

		<div class="flex-spacer" />

		<Searchbar />
		<Button on:click={() => { SubjectRelation.create(graph); update() }}>
			<img src={plusIcon} alt=""> Add Relation
		</Button>
	</div>

	{#if graph.subjectRelations.length > 0}
		<div class=row>
			<span style="grid-area: left;"> From </span>
			<span style="grid-area: right;"> To </span>
		</div>
	{:else}
		<h6 class="empty"> No subjects found </h6>
	{/if}

	{#each graph.subjectRelations as relation, n}
		<div class="row">
			<span class="id"> {n + 1} </span>
			<IconButton scale src={trashIcon} on:click={() => { relation.delete(); update() }} />
			<Dropdown label="Parent" placeholder="From Subject" options={relation.parentOptions()} bind:value={relation.parent} />
			<span class="preview" style:background-color={relation.parentColor()} />
			<Dropdown label="Child" placeholder="To Subject" options={relation.childOptions()} bind:value={relation.child} />
			<span class="preview" style:background-color={relation.childColor()} />
		</div>
	{/each}

</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

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
			grid-template: "id delete left parent-preview right child-preview" auto / $icon-width $icon-width 1fr $icon-width 1fr $icon-width
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
