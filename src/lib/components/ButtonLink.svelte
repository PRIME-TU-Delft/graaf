
<!-- Script -->

<script lang="ts">

    export let label: string;
    export let href: string;

</script>

<!-- Markup -->

<a href={href}>{label}</a>

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    a
        padding: 0.375rem 0.75rem

        color: variables.$blue
        text-decoration: none
        user-select: none

        transition: all 0.15s ease-in-out

        &:hover
            color: variables.$dark-blue
            text-decoration: underline
            cursor: pointer

</style>

