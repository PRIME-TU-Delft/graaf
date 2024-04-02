
<!-- Script -->

<script lang="ts">

    export let text: string;
    export let x: number;
    export let y: number;

</script>

<!-- Markup -->

<span style:top="{y}px" style:left="{x}px"> {text} </span>

<!-- Styles -->

<style lang="sass">

    @use "$styles/variables.sass" as *
    @use "$styles/palette.sass" as *

    span
        position: absolute
        translate: -50% -100%
        z-index: 9999

        width: max-content
        padding: 0 $input-thick-padding
        border-radius: $border-radius

        color: $white
        background: $dark-gray
        text-align: center

        pointer-events: none

        &::after
            position: absolute
            translate: -50% 50%
            rotate: 45deg
            bottom: 0
            left: 50%

            content: ""

            width: 0.5rem
            height: 0.5rem

            background: $dark-gray

</style>