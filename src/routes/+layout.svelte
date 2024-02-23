
<!-- Script -->

<script lang="ts">

    import '$styles/global.sass';

    import PRIME_logo from '$assets/PRIME-logo.svg';
    import TUDelft_logo from '$assets/TUD-logo.svg';

</script>

<!-- Markup -->

<header>
    <a href="/"><img src={PRIME_logo} alt="PRIME logo"></a>
    <h1>Graph editor</h1>
</header>

<div id="content">
    <slot />
</div>

<footer>
    <img src={TUDelft_logo} alt="TUDelft logo">
</footer>

<!-- Styles -->

<style lang="sass">

    @use "$styles/variables.sass"

    header
        display: flex
        flex-flow: row nowrap
        align-items: center

        background-color: variables.$light-gray

        a
            height: 4.5rem
            margin: 1rem

            img
                height: 100%
            
        h1
            padding-top: 0.4rem
            
            font-size: 2.5rem
            color: variables.$light-purple

    #content
        width: 100%
        max-width: 1200px
        margin: 0 auto
        padding: 2rem 1rem 5rem

    footer
        position: fixed
        bottom: 0
        width: 100%
        height: 5rem

        display: flex
        flex-flow: row nowrap
        align-items: center        

        img
            width: 5rem
            margin: 0 1.25rem

        @media screen and (max-width: calc( 1200px + 13rem ))
            background-color: white

</style>
