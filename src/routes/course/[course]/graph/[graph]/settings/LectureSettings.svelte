
<script lang="ts">

	// Internal imports
	import { Graph, Lecture } from '$scripts/graph/entities'

	// Components
	import Searchbar from '$components/Searchbar.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import IconButton from '$components/IconButton.svelte';


	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'

	// Exports
	export let graph: Graph

	// Variables
	let query: string = ''

	// Force reactivity update
	function update() {
		graph = graph // Maybe redundant Svelte 5?
	}

	// Checks if query appears in lecture
	function lectureMatchesQuery(query: string, lecture: Lecture): boolean {
		if (!query) return true
		query = query.toLowerCase()

		let name = lecture.name?.toLowerCase()
		if (name?.includes(query)) return true

		for (let subject of lecture.subjects) {
			let subjectName = subject?.name?.toLowerCase()
			if (subjectName?.includes(query)) return true
		}

		return false
	}

</script>



<!-- Markup -->



<div class="editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Lectures </h2>

		<div class="flex-spacer" />

		<Searchbar bind:value={query} />
		<Button on:click={() => { Lecture.create(graph); update() }}>
			<img src={plusIcon} alt=""> New Lecture
		</Button>
	</div>

	<!-- If any lectures were found that match the search -->
	{#if graph.lectures.some(lecture => lectureMatchesQuery(query, lecture))}

		<!-- List of lectures -->
		{#each graph.lectures as lecture, n}
			{#if lectureMatchesQuery(query, lecture)}
				<div class="lecture">
					<span> {n + 1} </span>
					<IconButton scale src={trashIcon} on:click={() => { lecture.delete(); update() }} />
					<Textfield label="Name" placeholder="Lecture name" bind:value={lecture.name} />
					<Button on:click={() => { lecture.addSubject(); update() }}> Add Subject </Button>
					
					<div class="subjects" style="grid-area: subjects;">
						{#each lecture.presentSubjects as _, m}
							<span> {m + 1} </span>
							<IconButton scale src={trashIcon} on:click={() => { lecture.removeSubject(m); update() }} />
							<Dropdown 
								label="Subject" 
								placeholder="Choose subject" 
								options={lecture.subjectOptions(m)} 
								bind:value={lecture.presentSubjects[m]}
								/>

							<span class="preview" style:background-color={lecture.subjectColor(m)} />
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	
	{:else}

		<!-- If no domains were found that match the search -->
		<h6 class="empty"> No lectures found </h6>

	{/if}
</div>



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	$icon-width: calc($input-icon-size + 2 * $input-icon-padding)
	$gutter-width: calc($icon-width + $form-small-gap)

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

		.lecture
			display: grid
			grid-template: "id delete name add-lecture" auto "subjects subjects subjects subjects" auto / $icon-width $icon-width 1fr auto
			place-items: center center
			gap: $form-small-gap

			.subjects
				display: grid
				grid-template: "id delete subject preview" auto / $icon-width $icon-width 1fr $icon-width
				place-items: center center
				gap: $form-small-gap

				place-self: center stretch
				padding-left: $gutter-width
				border-left: 1px solid $gray
				margin-left: $gutter-width

				.preview
					width: $input-icon-size
					height: $input-icon-size

</style>