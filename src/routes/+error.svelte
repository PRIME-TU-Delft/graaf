
<!-- Script -->

<script lang="ts">

    import { page } from '$app/stores';

</script>

<!-- Markup -->

<div>
    <h1>{$page.status}</h1>
    <p>{$page.error?.message}</p>    
</div>

<!-- Styles -->

<style lang="sass">

    @use "$styles/variables.sass"

    div
        position: absolute
        top: 50%
        left: 50%
        transform: translate(-50%, -50%)

        display: flex
        flex-flow: column nowrap
        align-items: center
        justify-content: center

    h1
        color: variables.$dark-purple
        font-size: 3rem
    p
        color: variables.$purple
        font-size: 1rem

</style>