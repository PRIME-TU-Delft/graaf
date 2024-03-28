
<!-- Script -->

<script lang="ts">
    
    import Textfield from "$components/Textfield.svelte";

    export let label: string;
	export let placeholder: string = "";
	export let obfuscate: boolean = false;

	$: id = label.toLowerCase().replace(/\s/g, "_");

</script>

<!-- Markup -->

<div class="textfield">
    <label for={id}> {label} </label>
    <Textfield {id} {placeholder} {obfuscate} />
</div>

<!-- Styles -->

<style lang="sass">

    @use "$styles/variables.sass" as *

    .textfield
        display: grid
        grid-template: "label input" auto / 1fr 2fr
        width: 100%

        label
            grid-area: label
            place-self: center end

            padding-right: 1em

        :global(input)
            grid-area: input

        @media screen and (max-width: $phone-breakpoint)
            grid-template: "label" auto "input" auto / 1fr

            label
                justify-self: start

</style>