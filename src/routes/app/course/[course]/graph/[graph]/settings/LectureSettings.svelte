
<script lang="ts">

	// Internal imports
	import { LectureController, LectureSubject } from '$scripts/controllers'
	import { graph } from '$stores'

	// Components
	import Button from '$components/Button.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import IconButton from '$components/IconButton.svelte';
	import Searchbar from '$components/Search.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Validation from '$components/Validation.svelte';

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'

	// Functions
	function lectureMatchesQuery(query: string, lecture: LectureController): boolean {
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
		/* Force store update
		 * Svelte is a lil dum dum, so subscribers are only notified if the store is reassigned.
		 * This happens either explicitly (like here), or in bind:value={store} bindings.
		 * So, if you want graph changes to reflect in the ui, you need to do either.
		 * It is rumored this will be better in Svelte 5, so im leaving this todo here.
		 */

		// TODO remove this function when Svelte 5 is released

		$graph = $graph
	}

	// Variables
	let query: string = ''

</script>


<!-- Markup -->


<div class="editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Lectures </h2>
		<div class="flex-spacer" />
		<Searchbar bind:value={query} />
		<Button on:click={async () => { await LectureController.create($graph); update() }}>
			<img src={plusIcon} alt=""> New Lecture
		</Button>
	</div>

	<!-- If any lectures were found that match the search -->
	{#if $graph.lectures.some(lecture => lectureMatchesQuery(query, lecture))}

		<!-- List of lectures -->
		{#each $graph.lectures as lecture}
			{#if lectureMatchesQuery(query, lecture)}
				<div class="lecture" id={lecture.anchor}>
					<Validation short data={lecture.validate()} />
					<span> {lecture.index + 1} </span>
					<IconButton scale
						src={trashIcon}
						on:click={async () => {
							await lecture.delete()
							update()
						}}
						/>

					<Textfield
						label="Name"
						placeholder="Lecture name"
						bind:value={lecture.name}
						on:change={async () => await lecture.save()}
						/>

					<Button on:click={() => { LectureSubject.create(lecture); update() }}>
						Add Subject
					</Button>

					<div class="subjects" style="grid-area: subjects;">
						{#each lecture.lecture_subjects as lecture_subject, n}
							<span> {n + 1} </span>
							<IconButton scale
								src={trashIcon}
								on:click={async () => {
									lecture_subject.delete()
									if (lecture_subject.subject)
										await lecture.save()
									update()
								}}
								/>

							<Dropdown
								label="Subject"
								placeholder="Choose subject"
								options={lecture_subject.options}
								bind:value={lecture_subject.subject}
								on:change={async () => await lecture.save()}
								/>

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