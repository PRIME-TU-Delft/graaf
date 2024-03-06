
<!-- Markup -->

<div>
    <slot />
</div>

<!-- Styles -->

<style lang="sass">

    @use "$styles/variables.sass" as *
    @use "$styles/palette.sass" as *

    div
        width: 100%
        max-width: $small-column

</style>
