
<script lang="ts">

	// Internal imports
	import { Graph, Lecture, LectureSubject } from '$scripts/entities'

	// Components
	import Button from '$components/Button.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import IconButton from '$components/IconButton.svelte';
	import Searchbar from '$components/Searchbar.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Validation from '$components/Validation.svelte';

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'

	// Functions
	function lectureMatchesQuery(query: string, lecture: Lecture): boolean {
		/* Checks if query appears in lecture */

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

	function update() {
		/* Updates the graph */
	
		graph = graph
		propagate_update()
	}

	// Variables
	export let graph: Graph
	export let propagate_update: () => void

	let query: string = ''

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
		{#each graph.lectures as lecture}
			{#if lectureMatchesQuery(query, lecture)}
				<div class="lecture" id={`lecture-${lecture.id}`}>
					<Validation short data={lecture.validate()} />
					<span> {lecture.index + 1} </span>
					<IconButton scale src={trashIcon} on:click={() => { lecture.delete(); update() }} />
					<Textfield label="Name" placeholder="Lecture name" bind:value={lecture.name} on:input={update} />
					<Button on:click={() => { LectureSubject.create(lecture); update() }}> Add Subject </Button>

					<div class="subjects" style="grid-area: subjects;">
						{#each lecture.lecture_subjects as lecture_subject, n}
							<span> {n + 1} </span>
							<IconButton scale src={trashIcon} on:click={() => { lecture_subject.delete(); update() }} />
							<Dropdown label="Subject" placeholder="Choose subject" options={lecture_subject.options} bind:value={lecture_subject.subject} on:input={update}/>
							<span class="preview" style:background-color={lecture_subject.color} />
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
			grid-template: "validation id delete name add-lecture" auto "subjects subjects subjects subjects subjects" auto / $icon-width $icon-width $icon-width 1fr auto
			place-items: center center
			gap: $form-small-gap

			padding-right: calc($icon-width + $form-small-gap)

			.subjects
				display: grid
				grid-template: "id delete subject preview" auto / $icon-width $icon-width 1fr $icon-width
				place-items: center center
				gap: $form-small-gap

				place-self: center stretch
				margin-left: calc($icon-width * 2 + $form-small-gap * 1.5)
				padding-left: calc($icon-width + $form-small-gap)
				border-left: 1px solid $gray

				.preview
					width: $input-icon-size
					height: $input-icon-size

</style>