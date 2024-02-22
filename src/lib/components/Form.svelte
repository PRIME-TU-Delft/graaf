

<!-- Markup -->

<form action="">
    <slot />
</form>

<!-- Styles -->

<style lang="sass">

    @use "$styles/variables.sass"

    form
        display: flex
        flex-flow: column nowrap
        align-items: center

        width: 70%
        min-width: 23.625rem // TODO maybe less janky dynamic sizing
        margin: 0 auto

</style>