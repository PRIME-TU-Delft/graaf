
<!-- Script -->

<script lang="ts">

    import '$styles/global.sass';
    import PRIME from '$assets/PRIME logo.svg';
    import TUDelft from '$assets/TUD logo - black.svg';

</script>

<!-- Markup -->

<header>
    <a id="PRIME-logo" href="/"><img src={PRIME} alt="PRIME logo"></a>
    <h1 id="title">Graph editor</h1>
</header>

<div id="content">
    <slot />
</div>

<img id="TUDelft-logo" src={TUDelft} alt="TUDelft logo">

<!-- Styles -->

<style lang="sass">

    @use "$styles/variables.sass"

    header
        display: flex
        align-items: center

        height: 6rem
        background-color: variables.$light-gray

        #PRIME-logo
            height: 4.5rem
            margin: 0 1rem

            img
                height: 100%
            
        #title
            margin: 0
            padding-top: 0.4rem

            font-weight: 500
            font-size: 2.5rem
            font-family: inherit
            color: variables.$light-purple

    #content
        height: 100%
        width: 100%
        max-width: 1200px
        margin: 1.5rem auto 0
        padding: 0 15px

    #TUDelft-logo
        position: fixed
        bottom: 20px
        left: 10px
        width: 60px

</style>