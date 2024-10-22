
<script lang="ts">

	// Internal dependencies
	import type { CourseController } from '$scripts/controllers'

	// Components
	import Textfield from '$components/forms/Textfield.svelte'
	import Searchbar from '$components/forms/Search.svelte'
	import Button from '$components/buttons/Button.svelte'
	import LinkButton from '$components/buttons/LinkButton.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'

	// Variables
	export let course: CourseController
	let program_query: string = ''

</script>


<!-- Markup -->


<div class="editor">

	<label for="code"> Course Code </label>
	<label for="name"> Course Name </label>

	<Textfield bind:value={course.code} id="code" />
	<Textfield bind:value={course.name} id="name" />

	<!-- Toolbar -->
	<div class="programs">
		<div class="toolbar">
			<h2> Programs </h2>
	
			<div class="flex-spacer" />
	
			<Searchbar bind:value={program_query} />
			<Button on:click={() => program_modal.show()}>
				<img src={plusIcon} alt="Add to Program"> Add to Program
			</Button>
		</div>
	

		{#await course.getPrograms().then(programs => programs.filter(program => program.matchesQuery(program_query))) then programs}
			{#if programs.length > 0}
				{#each programs as program, index}
					<div class="program">
						<span> {index + 1} </span>
						<span> {program.name} </span>
						<LinkButton href={`/app/program/${program.id}`}> View </LinkButton>
					</div>
				{/each}
			{:else}
				<h6 class="grayed"> No programs found </h6>
			{/if}
		{/await}
	</div>
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.editor
		display: grid
		grid-template: "left right" auto "left right" auto "programs programs" auto / 1fr 1fr
		grid-gap: $form-small-gap

		padding: $card-thick-padding

		.programs
			grid-area: programs

			display: flex
			flex-flow: column nowrap
			gap: $form-small-gap

			margin-top: $form-big-gap
			padding: 0 $card-thick-padding

			.toolbar
				display: flex
				margin-bottom: $form-big-gap
				gap: $form-small-gap
			
			.grayed
				margin: auto
				color: $gray

</style>