
<!-- Script -->

<script lang="ts">

    export let label: string;

</script>

<!-- Markup -->

<button>{label}</button>

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    button
        padding: 0.375rem 0.75rem

        border: 1px solid transparent
        border-radius: 0.25rem

        line-height: 1.5
        font-size: 1rem
        font-weight: 400
        font-family: inherit
        text-align: center
        vertical-align: middle

        color: white
        background-color: variables.$blue
        user-select: none

        transition: all 0.15s ease-in-out

        &:hover
            background-color: variables.$dark-blue
            cursor: pointer

</style>

