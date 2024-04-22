
<!-- Script -->

<script lang="ts">

    import Dropdown from "$components/Dropdown.svelte";
    import Textfield from "$components/Textfield.svelte";

    import { Graph } from '../../../classes'
    import { courses } from '$scripts/fakedata'
    
    export let graph: Graph;


    // TODO EVERYTHING BELOW THIS LINE IS TEMPORARY

</script>

<!-- Markup -->

<div class="editor">
    <div class="input">
        <label for="name"> Name </label>
        <Textfield label="Name" bind:value={graph.name} />
    </div>

    <div class="input">
        <label for="course"> Course </label>
        <Dropdown 
			label="Course" 
			placeholder="Choose a course" 
			options={courses.map(course => ({ name: course.name, value: course }))}
			bind:value={graph.course}
			/>
    </div>
</div>

<!-- Styles -->

<style lang="sass">

    @use "$styles/variables.sass" as *
    @use "$styles/palette.sass" as *

    .editor
        display: flex
        flex-flow: row wrap
        place-items: center start
        gap: $form-medium-gap

        padding: $card-thick-padding

        .input
            display: flex
            flex-flow: column nowrap
            flex: 1

</style>