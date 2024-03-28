
<!-- Script -->

<script lang="ts">
    
    import Button from "$components/Button.svelte";

    export let callback: () => void = () => {};
    export let href: string | undefined = undefined;

    export let submit: boolean = false;
	export let disabled: boolean = false;
	export let rotate: boolean = false;
	export let scale: boolean = false;

</script>

<!-- Markup -->

<div class="button">
    <Button {callback} {href} {submit} {disabled} {rotate} {scale}>
        <slot />
    </Button>
</div>

<!-- Styles -->

<style lang="sass">

    @use "$styles/variables.sass" as *

    .button
        display: grid
        grid-template: ". content" auto / 1fr 2fr
        justify-items: start

        width: 100%

        :global(*)
            grid-area: content

        @media screen and (max-width: $phone-breakpoint)
            grid-template: "content" auto / 1fr
            justify-items: center

</style>