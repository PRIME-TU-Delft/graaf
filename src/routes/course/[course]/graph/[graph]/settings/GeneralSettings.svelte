
<!-- Script -->

<script lang="ts">

    import Dropdown from "$components/Dropdown.svelte";
    import Textfield from "$components/Textfield.svelte";

    // TODO EVERYTHING BELOW THIS LINE IS TEMPORARY

    class Course {
		code: string;
		name: string;

		constructor(code: string, name: string) {
			this.code = code;
			this.name = name;
		}
	}

	let courses = [
		new Course("AESB1311", "Linear Algebra"),
		new Course("CSE1200",  "Calculus"),
		new Course("CSE1205",  "Linear Algebra"),
		new Course("CSE1210",  "Cluster Probability & Statistics"),
		new Course("CTB2105",  "Differentiaalvergelijkingen"),
		new Course("CTB2200",  "Kansrekening en Statistiek"),
		new Course("EE1M11",   "Linear Algebra and Analysis A"),
		new Course("EE1M21",   "Linear Algebra and Analysis B"),
		new Course("LB1155",   "Calculus"),
		new Course("NB2191",   "Differential Equations"),
		new Course("TB131B",   "Differentiaalvergelijkingen en Lineare Algebra"),
		new Course("TB132B",   "Multivariabele Calculus en Lineaire Algebra"),
		new Course("TN1401WI", "Analyse voor TNW 1"),
		new Course("WBMT",     "Linear Algebra"),
		new Course("WBMT1050", "Calculus for Engineering"),
		new Course("WI1402LR", "Calculus II"),
		new Course("WI1403LR", "Linear Algebra"),
		new Course("WI1421LR", "Calculus I"),
		new Course("WI2031TH", "Probability and Statistics")
	]

</script>

<!-- Markup -->

<form>

    <div class="input">
        <label for="name"> Name </label>
        <Textfield label="Name"  />
    </div>

    <div class="input">
        <label for="course"> Course </label>
        <Dropdown label="Course" placeholder="Choose a course" options={
            courses.map(course => ({ name: course.name, value: course }))
        } />
    </div>

</form>

<!-- Styles -->

<style lang="sass">

    @use "$styles/variables.sass" as *
    @use "$styles/palette.sass" as *

    form
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